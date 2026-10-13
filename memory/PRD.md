# Wealth Coach — PRD

## Original Problem Statement
A dark, premium, friendly, slightly-entertaining web app (mobile + desktop) called **Wealth Coach** that acts like a personal financial coach rather than a banking dashboard. Core idea: *Don't just show people their money — explain it and help them make better decisions.* An owl mascot ("Athena") adds personality during coaching, insights and milestones. ~22 pages covering money overview, spending understanding, AI insights, goals, spending plans, recurring payments, savings, investing education, an AI chat coach, a financial health score, and celebration moments.

## Architecture
- **Frontend:** React 19 (CRA + craco, `@/` alias), react-router v7, Tailwind, shadcn/ui, framer-motion, recharts, lucide-react, sonner. Dark "Obsidian & Gold" theme (emerald green + amber gold + indigo owl accent). Custom fonts: Outfit (headings), Inter (body), JetBrains Mono (numbers).
- **Backend:** FastAPI, all routes under `/api`. JWT email/password auth (Bearer token in localStorage). MongoDB (motor).
- **AI Coach:** Claude Sonnet 5.5 via `emergentintegrations` + `EMERGENT_LLM_KEY`. Answers using the user's live financial snapshot; chat history persisted in Mongo.
- **Demo data:** Realistic per-user seed (5 accounts, ~2 months of transactions, 3 goals, budget, recurring bills/subscriptions, notifications) generated on onboarding.

## User Personas
- Everyday earner who finds banking apps overwhelming and wants plain-language guidance.
- Goal-driven saver (emergency fund, vacation, car, home) tracking progress.
- Investing beginner who wants simple education, not jargon.

## Core Requirements (static)
Money overview & net worth · spending breakdown · AI insights · goals (create/track/celebrate) · spending plan/budget · recurring payments & subscriptions · savings tracker · investing academy · AI coach chat · financial health score · notifications · profile · premium upsell · owl mascot moments.

## Implemented (2026-06-08)
- Auth: register, login, me, protected routes, onboarding with demo-data seeding.
- Welcome, Auth (email + demo-only social), 3-step Onboarding.
- Home dashboard: net worth, spend change, health score ring, owl insight, main goal, quick actions, recent activity.
- Money (accounts grouped by type) → Account Details (income/spending + transactions) → Transaction dialog with live category change.
- Spending (donut + category breakdown vs usual).
- Insights (AI-derived cards + detail dialog with actions).
- Goals list + create (auto monthly calc) + Goal Details (contribute, edit, delete, celebration on completion).
- Spending Plan (budget bars, slider editing, gentle warnings).
- Recurring (bills + subscriptions + totals), Savings (rate ring, emergency fund), Investing (holdings + lesson accordion).
- Ask Coach (Claude Sonnet 5.5 chat with personalized answers, suggestions, persisted history).
- Notifications (mark all read), Profile (settings, reset demo), Wealth Coach Plus (demo upgrade).
- Responsive: desktop sidebar + mobile bottom nav with center owl + more-menu sheet.
- **Tested:** 25/25 backend pytest pass; all frontend flows verified. No critical bugs.

## Authentication system (COMPLETED — 2026-06)
- Custom JWT bearer auth (bcrypt + PyJWT), token in localStorage `wc_token`, persists across refresh. Kept existing system (not refactored to cookies) to avoid breaking Plaid/data flows.
- Sign Up now has **confirm-password** field + inline error messages (data-testid `auth-error`): min-6-char and password-match checks (removed HTML5 minLength so React inline errors surface). Duplicate-email and wrong-password errors shown inline.
- **Password reset by email** via Emergent-managed email proxy (`email_service.py`, EMERGENT_EMAIL_KEY + EMAIL_FROM_NAME="Wealth Coach" — no Resend key needed). `/auth/forgot-password` (generic response, no account enumeration) emails a 1hr single-use link `{origin}/reset-password?token=`; token stored sha256-hashed in `password_reset_tokens` (TTL index). `/auth/reset-password` validates invalid/expired/used + min length, updates bcrypt hash.
- New pages `ForgotPassword.jsx` + `ResetPassword.jsx`; routes added in App.js. Design matches existing.
- Logout clears token → Welcome; Protected routes redirect to /login; all data/Plaid endpoints scoped to user id.
- **Tested:** backend logic fully verified (register dup, login ok/fail, forgot generic + real email 202, reset invalid/short/valid/reuse/expired, login with new pw). Frontend iteration_4: 12/12 after minLength fix (signup validation, login, session reload, logout, protected redirect, forgot sent screen, reset token/validation).

## Plaid bank connection (DONE — 2026-06, Sandbox)
- Env: PLAID_CLIENT_ID / PLAID_SECRET / PLAID_ENV (=sandbox) + TOKEN_ENCRYPTION_KEY (Fernet). Secrets backend-only.
- Backend: `plaid_client.py` (httpx calls, token encrypt/decrypt, account/txn mapping) + routes in server.py: `/api/plaid/status|link-token|exchange|disconnect`. All user-scoped via user["id"]; access_token encrypted at rest in `plaid_items`.
- Frontend: `components/PlaidConnect.jsx` (react-plaid-link) on Money page — "Connect Bank" button opens Plaid Link; on success exchanges public_token, imports accounts + 90d transactions, shows connected/Disconnect state.
- Exchange polls `/transactions/sync` (retry + 2s sleep) so freshly-linked sandbox items capture initial transactions.
- First real connect replaces demo accounts/transactions with live Plaid data; dashboard/net worth reflect it.
- **Tested (2026-06):** full sandbox flow via API (link-token, sandbox public_token, exchange → 14 accounts + 16 txns), UI connected state screenshot, disconnect + reset-demo restores demo. Test account alex left disconnected/demo.

## Backlog / Remaining
- **P1:** Streaming AI responses (currently full-response). Split server.py into routers. Short-lived cache for compute_overview. Plaid webhook (SYNC_UPDATES_AVAILABLE) + stored cursor for ongoing txn sync. Production Plaid credentials + OAuth banks.
- **P2:** Real payments for Plus. Rate limiting on auth/coach. Password strength policy. Multi-month analytics/trends.

## Next Tasks
- Add streaming to the coach chat for a more "alive" feel.
- Allow manual add/edit of accounts & transactions.
- Monthly report generation for Plus users.
