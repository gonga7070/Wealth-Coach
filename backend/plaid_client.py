"""Plaid bank-connection integration (US + Canada). Credentials never touch the browser."""
import os
import logging
from datetime import datetime, timezone

import httpx
from cryptography.fernet import Fernet

logger = logging.getLogger("wealthcoach.plaid")

PLAID_CLIENT_ID = os.environ.get("PLAID_CLIENT_ID", "").strip()
PLAID_SECRET = os.environ.get("PLAID_SECRET", "").strip()
PLAID_ENV = os.environ.get("PLAID_ENV", "sandbox").strip()
_HOSTS = {"sandbox": "https://sandbox.plaid.com", "production": "https://production.plaid.com"}
PLAID_HOST = _HOSTS.get(PLAID_ENV, _HOSTS["sandbox"])

PLAID_ENABLED = bool(PLAID_CLIENT_ID and PLAID_SECRET)

_key = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
_fernet = Fernet(_key.encode()) if _key else None


def encrypt_token(token: str) -> str:
    return _fernet.encrypt(token.encode()).decode()


def decrypt_token(blob: str) -> str:
    return _fernet.decrypt(blob.encode()).decode()


async def plaid_request(path: str, payload: dict) -> dict:
    body = {"client_id": PLAID_CLIENT_ID, "secret": PLAID_SECRET, **payload}
    async with httpx.AsyncClient(base_url=PLAID_HOST, timeout=30) as c:
        r = await c.post(path, json=body)
    if r.is_error:
        try:
            err = r.json()
        except Exception:
            err = {}
        code = err.get("error_code", "PLAID_ERROR")
        msg = err.get("error_message", "Plaid request failed")
        logger.error(f"Plaid error on {path}: {code} ({err.get('request_id')})")
        raise PlaidError(code, msg)
    return r.json()


class PlaidError(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


# ---- Mapping Plaid data into Wealth Coach's own schema ----
_TYPE_MAP = {
    ("depository", "checking"): "checking",
    ("depository", "savings"): "savings",
    ("credit", "credit card"): "credit",
    ("investment", None): "investment",
    ("loan", None): "loan",
}


def map_account_type(plaid_type: str, subtype) -> str:
    t = (plaid_type or "").lower()
    s = (subtype or "").lower()
    if t == "depository":
        return "savings" if "savings" in s else "checking"
    if t == "credit":
        return "credit"
    if t == "investment" or t == "brokerage":
        return "investment"
    if t == "loan":
        return "loan"
    return "checking"


def map_accounts(plaid_accounts: list, institution: str, user_id: str, item_id: str = None, logo: str = None) -> list:
    out = []
    for a in plaid_accounts:
        bal = a.get("balances", {})
        current = bal.get("current") or 0
        acct_type = map_account_type(a.get("type"), a.get("subtype"))
        # credit/loan balances represent amounts owed -> store negative
        signed = -abs(current) if acct_type in ("credit", "loan") else current
        out.append({
            "user_id": user_id,
            "plaid_account_id": a.get("account_id"),
            "plaid_item_id": item_id,
            "name": a.get("name") or a.get("official_name") or "Account",
            "type": acct_type,
            "institution": institution,
            "institution_logo": logo,
            "mask": a.get("mask") or "0000",
            "balance": round(float(signed), 2),
            "currency": bal.get("iso_currency_code") or "USD",
            "source": "bank",
        })
    return out


def map_transactions(plaid_txns: list, acct_id_map: dict, user_id: str) -> list:
    """acct_id_map: plaid_account_id -> our account id (str)."""
    out = []
    for t in plaid_txns:
        our_acct = acct_id_map.get(t.get("account_id"))
        if not our_acct:
            continue
        # Plaid: positive amount = money leaving account (spend). Our convention: negative = spend.
        amount = -float(t.get("amount") or 0)
        pfc = (t.get("personal_finance_category") or {}).get("primary")
        category = _PFC_MAP.get(pfc, (t.get("category") or ["Shopping"])[0])
        if amount > 0:
            category = "Income"
        out.append({
            "user_id": user_id,
            "account_id": our_acct,
            "plaid_txn_id": t.get("transaction_id"),
            "merchant": t.get("merchant_name") or t.get("name") or "Transaction",
            "amount": round(amount, 2),
            "category": category,
            "date": (t.get("date") or datetime.now(timezone.utc).date().isoformat()) + "T00:00:00+00:00",
            "pending": bool(t.get("pending")),
            "note": "",
            "source": "bank",
        })
    return out


_PFC_MAP = {
    "INCOME": "Income",
    "RENT_AND_UTILITIES": "Bills",
    "FOOD_AND_DRINK": "Restaurants",
    "GENERAL_MERCHANDISE": "Shopping",
    "TRANSPORTATION": "Transportation",
    "TRAVEL": "Transportation",
    "ENTERTAINMENT": "Entertainment",
    "MEDICAL": "Health",
    "HOME_IMPROVEMENT": "Housing",
    "GENERAL_SERVICES": "Bills",
    "LOAN_PAYMENTS": "Bills",
    "PERSONAL_CARE": "Health",
}
