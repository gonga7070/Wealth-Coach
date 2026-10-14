# Wealth Coach — PRD

## Original Problem Statement
A dark, premium, friendly, slightly-entertaining web app (mobile + desktop) called **Wealth Coach** that acts like a personal financial coach rather than a banking dashboard. Core idea: *Don't just show people their money — explain it and help them make better decisions.* An owl mascot ("Athena") adds personality during coaching, insights and milestones. ~22 pages covering money overview, spending understanding, AI insights, goals, spending plans, recurring payments, savings, investing education, an AI chat coach, a financial health score, and celebration moments.

## Architecture
- **Frontend:** React 19 (CRA + craco, `@/` alias), react-router v7, Tailwind, shadcn/ui, framer-motion, recharts, lucide-react, sonner. Dark "Obsidian & Gold" theme (emerald green + amber gold + indigo owl accent). Custom fonts: Outfit (headings), Inter (body), JetBrains Mono (numbers).
- **Backend:** FastAPI, all routes under `/api`. JWT email/password auth (Bearer token in localStorage). MongoDB (motor).
- **AI Coach:** Claude Sonnet 5.5 via `emergentintegrations` + `EMERGENT_LLM_KEY`. Answers using the user's live financial snapshot; chat history persisted in Mongo.
- **Demo data:** Realistic per-user seed (5 accounts, ~2 months of transactions, 3 goals, budget, recurring bills/subscriptions, notifications) generated on onboarding.


## Reset-to-zero + menu Settings (COMPLETED & TESTED — 2026-06)
- Mobile hamburger (3-bars) menu now has a **Settings** entry (the Profile nav was renamed Settings, gear icon) and a **"Reset app to zero"** action with explanation ("Clears all your data and starts fresh. You stay logged in.").
- Same reset also added to Settings → Privacy & data (reset-app-btn → confirm dialog).
- Backend POST `/profile/reset-data`: removes Plaid items (from Plaid), wipes accounts/transactions/goals/budget/recurring/notifications/coach_messages/plaid_items, resets goal/help/banks/preferences to defaults, keeps user logged in (onboarded stays true). Does NOT delete the account or require re-login.
- Tested: seeded data → reset → 0 accounts / $0 net worth / empty dashboard, `/auth/me` still 200 with same token; mobile menu shows Settings + reset button.

## Manual transaction entry (COMPLETED & TESTED — 2026-06)
- Account Details page: manual accounts get an "Add transaction" button and each row opens an edit dialog (edit fields or delete). Bank accounts stay read-only (recategorize only).
- Dialog fields: description, type (Expense/Income), amount, category, date, note.
- Backend: POST `/transactions`, PATCH `/transactions/{id}`, DELETE `/transactions/{id}` (all manual-only). Each change keeps the manual account's balance in sync (inc/dec by amount/delta). Manual txns are restricted to manual accounts; bank transactions reject edit/delete (400).
- Tested: API add/edit/delete with correct balance math + bank-txn rejection; UI add verified (balance + spending updated live).

## No-fabricated-data update (2026-06)
Per user: the app shows ONLY the user's own real data — no simulated/sample data anywhere.
- Removed the "Explore with sample data" onboarding option; onboarding never seeds; `/profile/reset-demo` now returns 410 (disabled).
- Home dashboard is honest when empty: hides net worth, health score, streak/level chips and spending-change headline until the user has real accounts; shows a clear "Add your money" empty state + quick nav instead.
- Manual accounts can now be removed from the Money page (trash button on manual rows → DELETE /accounts/{id}); bank connections removed via Settings disconnect; manual + bank add unchanged.
- Settings confirmed: log out (Settings + sidebar), bank add/remove, light/dark theme, preferences.
Note: alex@demo.com retains seeded data purely as a QA/demo login; real user accounts never get fabricated data.

## Real-user Phase 1 (COMPLETED & TESTED — 2026-06)
Turned the demo prototype into a real-data app. User choices: empty-by-default + labeled sample mode; per-currency (no CAD/USD blending); soft email-verification gate; manual entry included; Plaid stays Sandbox.

Backend (server.py, plaid_client.py, email_service.py):
- Onboarding no longer auto-seeds; `use_demo` flag controls sample data; new users start empty with `demo_mode` + `preferences` + `email_verified:false`.
- Email verification: `/auth/send-verification`, `/auth/verify-email` (24h single-use token, TTL index), verification email on register. Soft gate (banner only).
- `/auth/change-password` (bcrypt, current-password check).
- Plaid multi-connect: exchange APPENDS institutions, stores per-item cursor/logo/currency/last_sync; first real connect clears demo. `/plaid/items`, `/plaid/refresh`, `/plaid/reconnect` (update-mode token), `/plaid/disconnect` per-item.
- Manual entry: POST `/accounts`, PATCH/DELETE `/accounts/{id}`, POST `/transactions`, DELETE `/transactions/{id}` (manual-only). `source` field distinguishes bank vs manual.
- `/accounts` returns `by_currency` + `last_updated`. Preferences GET/PUT `/profile/preferences`. `/profile/export` (JSON), DELETE `/profile`.

Frontend:
- VerifyBanner + VerifyEmail page (/verify-email). Onboarding real 3-choice final step (connect/manual/sample); fake bank picker removed.
- Home + Money empty states; Money manual AddAccountDialog, per-currency net worth, source+logo badges, last-updated.
- Settings page (replaces Profile): Profile, Security (verify status + change password), Bank connections (items + sync/reconnect/disconnect), Financial preferences, Notifications, Appearance, Privacy & data (consent, export, delete account).
- AuthContext.refreshUser; user carries email_verified/demo_mode/preferences.

Tested: backend all endpoints via scripts; frontend iteration_5 25/25 (onboarding setBanks bug fixed). Sandbox Plaid multi-connect verified.

## Phase 2 backlog (not yet built)
- Manual transaction add/edit UI on Account Details (backend endpoints exist).
- Deeper empty states for Spending/Insights/Goals/Budget (zero-safe but minimal).
- Health score shows ~65 base on empty data (cosmetic — consider "—" when no accounts).
- Optional live FX conversion (user chose per-currency only).
- Production Plaid (needs user creds + Plaid production + Canada/Transactions approval).

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
