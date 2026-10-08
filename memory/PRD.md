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

## Backlog / Remaining
- **P1:** Streaming AI responses (currently full-response). Split server.py into routers. Short-lived cache for compute_overview.
- **P2:** Real bank linking (Plaid) — currently demo/manual. Real payments for Plus. Rate limiting on auth/coach. Password strength policy. Multi-month analytics/trends.

## Next Tasks
- Add streaming to the coach chat for a more "alive" feel.
- Allow manual add/edit of accounts & transactions.
- Monthly report generation for Plus users.
