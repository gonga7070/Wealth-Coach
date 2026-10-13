"""Emergent-managed transactional email (password reset). Secrets stay server-side."""
import os
import re
import ipaddress
import logging
import httpx
from html.parser import HTMLParser
from urllib.parse import urlparse

logger = logging.getLogger("wealthcoach.email")

# Emergent managed email proxy. Hardcoded constant so it survives deployment.
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        try:
            code = e.response.json().get("code", "")
        except ValueError:
            code = ""
        if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
            logger.warning(f"Email paused: {code} ({e.response.status_code})")
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="Email is temporarily unavailable")
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        from fastapi import HTTPException
        raise HTTPException(status_code=502, detail="Failed to send email")
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Failed to send email")


def reset_email_html(name: str, reset_link: str) -> str:
    from html import escape
    safe_name = escape(name or "there")
    safe_link = escape(reset_link)
    return (
        '<table role="presentation" width="100%" style="background:#0b0d10;padding:32px 0">'
        '<tr><td align="center">'
        '<table role="presentation" width="480" style="background:#14171c;border-radius:16px;'
        'font-family:Arial,Helvetica,sans-serif;color:#e8eaed">'
        '<tr><td style="padding:32px">'
        '<p style="font-size:20px;font-weight:bold;margin:0 0 8px;color:#f5b301">Wealth Coach</p>'
        f'<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Hi {safe_name}, we got a request '
        'to reset your Wealth Coach password.</p>'
        '<p style="font-size:15px;line-height:1.6;margin:0 0 24px">Click the button below to choose a '
        'new password. This link expires in 1 hour and can be used once.</p>'
        f'<a href="{safe_link}" style="display:inline-block;background:#f5b301;color:#0b0d10;'
        'text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px;font-size:15px">'
        'Reset my password</a>'
        '<p style="font-size:13px;line-height:1.6;color:#9aa0a6;margin:24px 0 0">If you didn\'t request '
        'this, you can safely ignore this email, your password stays the same.</p>'
        '<p style="font-size:12px;color:#6b7280;margin:20px 0 0">Sent by Wealth Coach. We will never ask '
        'you for your password or bank login by email.</p>'
        '</td></tr></table></td></tr></table>'
    )
