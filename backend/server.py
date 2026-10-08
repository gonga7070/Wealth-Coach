from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt
import logging

import seed as seed_mod
import coach as coach_mod

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wealthcoach")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Wealth Coach API")
api = APIRouter(prefix="/api")


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        if user.get("guest"):
            raise HTTPException(status_code=401, detail="Session expired, please sign in")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def oid(x):
    return ObjectId(x)


def clean(doc):
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.pop("user_id", None)
    doc.pop("password_hash", None)
    return doc


# ---------------- Models ----------------
class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class OnboardingReq(BaseModel):
    primary_goal: str
    help_with: List[str] = []
    use_demo: bool = True
    name: Optional[str] = None
    country: Optional[str] = None
    banks: List[str] = []


class CategoryUpdate(BaseModel):
    category: str


class GoalReq(BaseModel):
    name: str
    type: str = "custom"
    icon: str = "Target"
    target: float
    current: float = 0
    monthly_contribution: float = 0
    deadline: Optional[str] = None
    color: str = "#F59E0B"


class GoalUpdate(BaseModel):
    target: Optional[float] = None
    current: Optional[float] = None
    monthly_contribution: Optional[float] = None
    deadline: Optional[str] = None


class ContributeReq(BaseModel):
    amount: float


class BudgetUpdate(BaseModel):
    category: str
    limit: float


class ChatReq(BaseModel):
    message: str


# ---------------- Seeding ----------------
async def seed_user_data(user_id: str, primary_goal: str, banks=None):
    await db.accounts.delete_many({"user_id": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.goals.delete_many({"user_id": user_id})
    await db.budget.delete_many({"user_id": user_id})
    await db.recurring.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})

    data = seed_mod.build_demo_data(user_id, primary_goal, banks)
    res = await db.accounts.insert_many(data["accounts"])
    acct_ids = [str(i) for i in res.inserted_ids]
    checking_id = acct_ids[0]
    credit_id = acct_ids[2]

    txns = seed_mod.build_transactions(user_id, checking_id, credit_id)
    if txns:
        await db.transactions.insert_many(txns)
    await db.goals.insert_many(seed_mod.build_goals(user_id, primary_goal))
    await db.budget.insert_many(seed_mod.build_budget(user_id))
    await db.recurring.insert_many(seed_mod.build_recurring(user_id))
    await db.notifications.insert_many(seed_mod.build_notifications(user_id))


# ---------------- Analytics helpers ----------------
def _month_start():
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def compute_overview(user_id: str):
    accounts = await db.accounts.find({"user_id": user_id}).to_list(100)
    net_worth = sum(a["balance"] for a in accounts)
    checking = sum(a["balance"] for a in accounts if a["type"] == "checking")
    savings = sum(a["balance"] for a in accounts if a["type"] == "savings")

    txns = await db.transactions.find({"user_id": user_id}).to_list(5000)
    ms = _month_start().isoformat()
    month_txns = [t for t in txns if t["date"] >= ms]
    income = sum(t["amount"] for t in month_txns if t["amount"] > 0)
    spending = -sum(t["amount"] for t in month_txns if t["amount"] < 0 and t["category"] != "Income")

    # previous month spending for comparison
    prev_start = (_month_start() - timedelta(days=1)).replace(day=1).isoformat()
    prev_end = _month_start().isoformat()
    prev_txns = [t for t in txns if prev_start <= t["date"] < prev_end]
    prev_spending = -sum(t["amount"] for t in prev_txns if t["amount"] < 0 and t["category"] != "Income")

    savings_rate = round((income - spending) / income * 100) if income > 0 else 0

    # category breakdown this month
    cats = {}
    for t in month_txns:
        if t["amount"] < 0 and t["category"] != "Income":
            cats[t["category"]] = cats.get(t["category"], 0) + (-t["amount"])
    top = sorted(cats.items(), key=lambda x: -x[1])

    # health score: savings rate, debt ratio, budget adherence
    debt = -sum(a["balance"] for a in accounts if a["balance"] < 0)
    assets = sum(a["balance"] for a in accounts if a["balance"] > 0)
    debt_ratio = debt / assets if assets else 0
    score = 50
    score += min(savings_rate, 30)  # up to +30
    score += max(-20, min(20, int((0.3 - debt_ratio) * 50)))  # debt effect
    if checking > 0:
        score += 5
    score = max(5, min(100, score))

    spend_change = round((spending - prev_spending) / prev_spending * 100) if prev_spending else 0

    return {
        "net_worth": round(net_worth, 2),
        "available": round(checking, 2),
        "savings": round(savings, 2),
        "monthly_income": round(income, 2),
        "monthly_spending": round(spending, 2),
        "prev_spending": round(prev_spending, 2),
        "spend_change_pct": spend_change,
        "savings_rate": savings_rate,
        "health_score": int(score),
        "categories": [{"category": c, "amount": round(a, 2)} for c, a in top],
        "debt": round(debt, 2),
    }


def _health_label(score):
    if score >= 80:
        return "Thriving"
    if score >= 65:
        return "On Track"
    if score >= 45:
        return "Building"
    return "Needs Care"


async def build_insights(user_id: str, overview: dict):
    insights = []
    cats = {c["category"]: c["amount"] for c in overview["categories"]}
    budget = await db.budget.find({"user_id": user_id}).to_list(100)
    bmap = {b["category"]: b["limit"] for b in budget}

    # restaurant / overspending insight
    for cat, amt in cats.items():
        limit = bmap.get(cat)
        if limit and amt > limit:
            insights.append({
                "id": f"over-{cat}",
                "type": "alert",
                "icon": "TrendingUp",
                "title": f"{cat} spending is higher than usual",
                "summary": f"You've spent ${amt:,.0f} on {cat.lower()} — about ${amt-limit:,.0f} over your plan of ${limit:,.0f}.",
                "this_month": round(amt, 2),
                "usual": round(limit, 2),
                "difference": round(amt - limit, 2),
                "actions": ["Set a tighter plan", "View transactions"],
            })

    # subscriptions
    recurring = await db.recurring.find({"user_id": user_id, "is_subscription": True}).to_list(100)
    if recurring:
        total = sum(r["amount"] for r in recurring)
        insights.append({
            "id": "subs",
            "type": "info",
            "icon": "RefreshCw",
            "title": f"You have {len(recurring)} active subscriptions",
            "summary": f"They add up to ${total:,.2f}/month. Reviewing a couple could free up cash.",
            "this_month": round(total, 2),
            "usual": None,
            "difference": None,
            "actions": ["Review subscriptions"],
        })

    # savings opportunity
    if overview["savings_rate"] > 0:
        potential = round(overview["monthly_spending"] * 0.12)
        insights.append({
            "id": "savings-opp",
            "type": "positive",
            "icon": "PiggyBank",
            "title": f"You could save about ${potential}/month",
            "summary": f"Trimming discretionary spending by ~12% would boost your savings without big sacrifices.",
            "this_month": potential,
            "usual": None,
            "difference": None,
            "actions": ["See where to trim"],
        })

    # goals ahead of schedule
    goals = await db.goals.find({"user_id": user_id}).to_list(100)
    for g in goals:
        pct = g["current"] / g["target"] if g["target"] else 0
        if pct >= 0.6:
            insights.append({
                "id": f"goal-{str(g['_id'])}",
                "type": "positive",
                "icon": "Trophy",
                "title": f"Your {g['name']} is ahead of schedule",
                "summary": f"You're {pct*100:.0f}% of the way to ${g['target']:,.0f}. Keep the momentum going!",
                "this_month": round(g["current"], 2),
                "usual": round(g["target"], 2),
                "difference": None,
                "actions": ["View goal"],
            })
            break
    return insights


# ---------------- Auth routes ----------------
@api.post("/auth/register")
async def register(req: RegisterReq):
    email = req.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    doc = {"name": req.name, "email": email, "password_hash": hash_password(req.password),
           "onboarded": False, "plus": False, "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email)
    return {"token": token, "user": {"id": uid, "name": req.name, "email": email, "onboarded": False, "plus": False}}


@api.post("/auth/login")
async def login(req: LoginReq):
    email = req.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    uid = str(user["_id"])
    token = create_access_token(uid, email)
    return {"token": token, "user": {"id": uid, "name": user["name"], "email": email,
                                     "onboarded": user.get("onboarded", False), "plus": user.get("plus", False)}}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"],
            "onboarded": user.get("onboarded", False), "plus": user.get("plus", False),
            "country": user.get("country"), "banks": user.get("banks", [])}


@api.post("/onboarding")
async def onboarding(req: OnboardingReq, user: dict = Depends(get_current_user)):
    updates = {"onboarded": True, "primary_goal": req.primary_goal, "help_with": req.help_with,
               "country": req.country, "banks": req.banks}
    if req.name:
        updates["name"] = req.name
    await db.users.update_one({"_id": oid(user["id"])}, {"$set": updates})
    await seed_user_data(user["id"], req.primary_goal, req.banks)
    return {"ok": True}


# ---------------- Dashboard ----------------
@api.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    ov = await compute_overview(user["id"])
    goals = [clean(g) for g in await db.goals.find({"user_id": user["id"]}).to_list(100)]
    primary = goals[0] if goals else None
    insights = await build_insights(user["id"], ov)
    recent = await db.transactions.find({"user_id": user["id"]}).sort("date", -1).limit(6).to_list(6)
    recent = [clean(t) for t in recent]
    accounts = [clean(a) for a in await db.accounts.find({"user_id": user["id"]}).to_list(100)]

    if ov["spend_change_pct"] < 0:
        headline = f"Your money is looking good. You spent {abs(ov['spend_change_pct'])}% less this month."
    elif ov["spend_change_pct"] > 0:
        headline = f"Heads up — you've spent {ov['spend_change_pct']}% more than last month."
    else:
        headline = "You're keeping a steady pace this month."

    return {
        "overview": ov,
        "health_label": _health_label(ov["health_score"]),
        "primary_goal": primary,
        "top_insight": insights[0] if insights else None,
        "recent_transactions": recent,
        "accounts": accounts,
        "headline": headline,
        "name": user["name"],
    }


# ---------------- Accounts ----------------
@api.get("/accounts")
async def get_accounts(user: dict = Depends(get_current_user)):
    accounts = [clean(a) for a in await db.accounts.find({"user_id": user["id"]}).to_list(100)]
    return {"accounts": accounts, "net_worth": round(sum(a["balance"] for a in accounts), 2)}


@api.get("/accounts/{account_id}")
async def account_details(account_id: str, user: dict = Depends(get_current_user)):
    acct = await db.accounts.find_one({"_id": oid(account_id), "user_id": user["id"]})
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
    txns = await db.transactions.find({"user_id": user["id"], "account_id": account_id}).sort("date", -1).to_list(500)
    txns = [clean(t) for t in txns]
    income = sum(t["amount"] for t in txns if t["amount"] > 0)
    spending = -sum(t["amount"] for t in txns if t["amount"] < 0)
    return {"account": clean(acct), "transactions": txns,
            "income": round(income, 2), "spending": round(spending, 2)}


# ---------------- Transactions ----------------
@api.get("/transactions")
async def list_transactions(user: dict = Depends(get_current_user)):
    txns = await db.transactions.find({"user_id": user["id"]}).sort("date", -1).to_list(1000)
    accts = {str(a["_id"]): a["name"] for a in await db.accounts.find({"user_id": user["id"]}).to_list(100)}
    out = []
    for t in txns:
        c = clean(t)
        c["account_name"] = accts.get(c["account_id"], "Account")
        out.append(c)
    return {"transactions": out}


@api.get("/transactions/{txn_id}")
async def txn_detail(txn_id: str, user: dict = Depends(get_current_user)):
    t = await db.transactions.find_one({"_id": oid(txn_id), "user_id": user["id"]})
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    acct = await db.accounts.find_one({"_id": oid(t["account_id"])})
    c = clean(t)
    c["account_name"] = acct["name"] if acct else "Account"
    return c


@api.patch("/transactions/{txn_id}/category")
async def update_category(txn_id: str, req: CategoryUpdate, user: dict = Depends(get_current_user)):
    res = await db.transactions.update_one({"_id": oid(txn_id), "user_id": user["id"]},
                                           {"$set": {"category": req.category}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True, "category": req.category}


# ---------------- Spending ----------------
def _range_start(range_key: str):
    """Return ISO start datetime string for a range, or None for 'all'."""
    now = datetime.now(timezone.utc)
    ms = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if range_key == "this_month":
        return ms.isoformat(), None, "This month"
    if range_key == "last_month":
        start = (ms - timedelta(days=1)).replace(day=1)
        return start.isoformat(), ms.isoformat(), "Last month"
    if range_key == "3m":
        start = ms
        for _ in range(2):
            start = (start - timedelta(days=1)).replace(day=1)
        return start.isoformat(), None, "Last 3 months"
    if range_key == "6m":
        start = ms
        for _ in range(5):
            start = (start - timedelta(days=1)).replace(day=1)
        return start.isoformat(), None, "Last 6 months"
    return None, None, "All time"


def _spending_trend(txns, n=6):
    """Spending total per month for the last n months, oldest first."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    buckets = []
    cursor = month_start
    starts = []
    for _ in range(n):
        starts.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    starts = list(reversed(starts))
    for i, s in enumerate(starts):
        e = starts[i + 1] if i + 1 < len(starts) else None
        s_iso = s.isoformat()
        total = 0.0
        for t in txns:
            if t["amount"] < 0 and t["category"] != "Income" and t["date"] >= s_iso and (e is None or t["date"] < e.isoformat()):
                total += -t["amount"]
        buckets.append({"month": s.strftime("%b"), "amount": round(total, 2)})
    return buckets


@api.get("/spending")
async def spending(user: dict = Depends(get_current_user), range: str = "this_month"):
    txns = await db.transactions.find({"user_id": user["id"]}).to_list(5000)
    start, end, label = _range_start(range)
    sel = [t for t in txns if (start is None or t["date"] >= start) and (end is None or t["date"] < end)]

    budget = await db.budget.find({"user_id": user["id"]}).to_list(100)
    bmap = {b["category"]: b["limit"] for b in budget}
    cat_info = seed_mod.CATEGORIES

    cats = {}
    for t in sel:
        if t["amount"] < 0 and t["category"] != "Income":
            cats[t["category"]] = cats.get(t["category"], 0) + (-t["amount"])
    ordered = sorted(cats.items(), key=lambda x: -x[1])

    # how many months the range spans, for a fair "usual" comparison
    months_span = {"this_month": 1, "last_month": 1, "3m": 3, "6m": 6, "all": max(1, len(_spending_trend(txns, 6)))}.get(range, 1)

    out = []
    total = 0.0
    for cat, amt in ordered:
        total += amt
        usual = bmap.get(cat, round(amt / months_span)) * months_span
        out.append({
            "category": cat,
            "amount": round(amt, 2),
            "usual": round(usual, 2),
            "difference": round(amt - usual, 2),
            "color": cat_info.get(cat, {}).get("color", "#94A3B8"),
            "icon": cat_info.get(cat, {}).get("icon", "Circle"),
        })
    return {
        "categories": out,
        "total": round(total, 2),
        "range": range,
        "range_label": label,
        "trend": _spending_trend(txns, 6),
    }


# ---------------- Insights ----------------
@api.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    ov = await compute_overview(user["id"])
    return {"insights": await build_insights(user["id"], ov)}


# ---------------- Goals ----------------
@api.get("/goals")
async def get_goals(user: dict = Depends(get_current_user)):
    goals = [clean(g) for g in await db.goals.find({"user_id": user["id"]}).to_list(100)]
    return {"goals": goals}


@api.get("/goals/{goal_id}")
async def goal_detail(goal_id: str, user: dict = Depends(get_current_user)):
    g = await db.goals.find_one({"_id": oid(goal_id), "user_id": user["id"]})
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    return clean(g)


@api.post("/goals")
async def create_goal(req: GoalReq, user: dict = Depends(get_current_user)):
    doc = req.model_dump()
    doc["user_id"] = user["id"]
    res = await db.goals.insert_one(doc)
    return clean(await db.goals.find_one({"_id": res.inserted_id}))


@api.patch("/goals/{goal_id}")
async def update_goal(goal_id: str, req: GoalUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if updates:
        await db.goals.update_one({"_id": oid(goal_id), "user_id": user["id"]}, {"$set": updates})
    g = await db.goals.find_one({"_id": oid(goal_id), "user_id": user["id"]})
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    return clean(g)


@api.post("/goals/{goal_id}/contribute")
async def contribute(goal_id: str, req: ContributeReq, user: dict = Depends(get_current_user)):
    g = await db.goals.find_one({"_id": oid(goal_id), "user_id": user["id"]})
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    new_current = min(g["target"], g["current"] + req.amount)
    await db.goals.update_one({"_id": oid(goal_id)}, {"$set": {"current": new_current}})
    reached = new_current >= g["target"]
    g["current"] = new_current
    return {"goal": clean(g), "reached": reached}


@api.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    await db.goals.delete_one({"_id": oid(goal_id), "user_id": user["id"]})
    return {"ok": True}


# ---------------- Budget / Spending Plan ----------------
@api.get("/budget")
async def get_budget(user: dict = Depends(get_current_user)):
    ov = await compute_overview(user["id"])
    spent = {c["category"]: c["amount"] for c in ov["categories"]}
    budget = await db.budget.find({"user_id": user["id"]}).to_list(100)
    cat_info = seed_mod.CATEGORIES
    out = []
    for b in budget:
        s = spent.get(b["category"], 0)
        out.append({
            "id": str(b["_id"]),
            "category": b["category"],
            "limit": b["limit"],
            "spent": round(s, 2),
            "pct": round(s / b["limit"] * 100) if b["limit"] else 0,
            "color": cat_info.get(b["category"], {}).get("color", "#94A3B8"),
            "icon": cat_info.get(b["category"], {}).get("icon", "Circle"),
        })
    return {"budget": out, "total_limit": sum(b["limit"] for b in budget),
            "total_spent": round(sum(spent.get(b["category"], 0) for b in budget), 2)}


@api.patch("/budget")
async def update_budget(req: BudgetUpdate, user: dict = Depends(get_current_user)):
    await db.budget.update_one({"user_id": user["id"], "category": req.category},
                               {"$set": {"limit": req.limit}}, upsert=True)
    return {"ok": True}


# ---------------- Recurring ----------------
@api.get("/recurring")
async def recurring(user: dict = Depends(get_current_user)):
    items = [clean(r) for r in await db.recurring.find({"user_id": user["id"]}).to_list(100)]
    total = round(sum(r["amount"] for r in items), 2)
    subs = round(sum(r["amount"] for r in items if r["is_subscription"]), 2)
    return {"items": items, "total_monthly": total, "subscriptions_total": subs,
            "subscription_count": sum(1 for r in items if r["is_subscription"])}


# ---------------- Savings ----------------
@api.get("/savings")
async def savings(user: dict = Depends(get_current_user)):
    ov = await compute_overview(user["id"])
    emergency = await db.goals.find_one({"user_id": user["id"], "type": "emergency"})
    rec_target = round(ov["monthly_income"] * 0.20)
    monthly_saved = round(ov["monthly_income"] - ov["monthly_spending"], 2)
    return {
        "total_savings": ov["savings"],
        "savings_rate": ov["savings_rate"],
        "monthly_contribution": max(0, monthly_saved),
        "recommended_target": rec_target,
        "emergency_fund": clean(emergency) if emergency else None,
    }


# ---------------- Investing (educational) ----------------
INVESTING_LESSONS = [
    {"id": "stocks", "title": "Stocks", "icon": "LineChart", "level": "Beginner",
     "summary": "A share of ownership in a company.",
     "body": "When you buy a stock, you own a tiny slice of that company. If the company grows, your slice can become more valuable. Stocks can rise and fall quickly, so they're best for money you won't need for several years."},
    {"id": "etfs", "title": "ETFs", "icon": "Boxes", "level": "Beginner",
     "summary": "A basket of many investments in one.",
     "body": "An ETF (exchange-traded fund) bundles dozens or hundreds of stocks or bonds together. Buying one share spreads your money across all of them instantly — an easy way to diversify."},
    {"id": "index", "title": "Index Funds", "icon": "BarChart3", "level": "Beginner",
     "summary": "Track the whole market, cheaply.",
     "body": "An index fund simply mirrors a market index like the S&P 500. Because no one is hand-picking stocks, fees are very low. Historically this simple approach beats most active investors."},
    {"id": "bonds", "title": "Bonds", "icon": "Landmark", "level": "Beginner",
     "summary": "Lending money for steady interest.",
     "body": "A bond is a loan you give to a government or company. In return they pay you interest. Bonds are generally calmer than stocks, which makes them useful for balancing risk."},
    {"id": "retirement", "title": "Retirement Accounts", "icon": "PiggyBank", "level": "Intermediate",
     "summary": "Tax-friendly accounts for the long run.",
     "body": "Accounts like a 401(k) or IRA give you tax advantages for saving toward retirement. Many employers even match contributions — that's free money you don't want to leave behind."},
    {"id": "diversification", "title": "Diversification", "icon": "Shapes", "level": "Core idea",
     "summary": "Don't put all your eggs in one basket.",
     "body": "Spreading money across different investments means one bad apple won't sink your whole portfolio. Diversification is the closest thing to a free lunch in investing."},
    {"id": "risk", "title": "Understanding Risk", "icon": "Gauge", "level": "Core idea",
     "summary": "Higher reward usually means higher risk.",
     "body": "Every investment balances potential reward against the chance of loss. The key is matching risk to your timeline — more adventurous for far-off goals, calmer for money you'll need soon."},
]


@api.get("/investing")
async def investing(user: dict = Depends(get_current_user)):
    accts = await db.accounts.find({"user_id": user["id"], "type": "investment"}).to_list(100)
    holdings = [clean(a) for a in accts]
    total = round(sum(a["balance"] for a in accts), 2)
    return {"lessons": INVESTING_LESSONS, "holdings": holdings, "total_invested": total}


# ---------------- Coach ----------------
@api.get("/coach/history")
async def coach_history(user: dict = Depends(get_current_user)):
    msgs = await db.coach_messages.find({"user_id": user["id"]}).sort("ts", 1).to_list(200)
    return {"messages": [{"role": m["role"], "content": m["content"]} for m in msgs]}


@api.post("/coach/chat")
async def coach_chat(req: ChatReq, user: dict = Depends(get_current_user)):
    ov = await compute_overview(user["id"])
    goals = await db.goals.find({"user_id": user["id"]}).to_list(100)
    goals_str = "; ".join(f"{g['name']} (${g['current']:,.0f} of ${g['target']:,.0f})" for g in goals)
    top = ", ".join(f"{c['category']} ${c['amount']:,.0f}" for c in ov["categories"][:4])
    context = {
        "user_id": user["id"],
        "net_worth": ov["net_worth"], "available": ov["available"], "savings": ov["savings"],
        "monthly_income": ov["monthly_income"], "monthly_spending": ov["monthly_spending"],
        "savings_rate": ov["savings_rate"], "health_score": ov["health_score"],
        "top_categories": top, "goals": goals_str,
    }
    history = await db.coach_messages.find({"user_id": user["id"]}).sort("ts", 1).to_list(200)
    hist = [{"role": m["role"], "content": m["content"]} for m in history]

    now = datetime.now(timezone.utc).isoformat()
    await db.coach_messages.insert_one({"user_id": user["id"], "role": "user", "content": req.message, "ts": now})
    try:
        reply = await coach_mod.coach_reply(req.message, context, hist)
    except Exception as e:
        logger.error(f"coach error: {e}")
        reply = "I'm having a little trouble thinking right now. Try asking me again in a moment."
    await db.coach_messages.insert_one({"user_id": user["id"], "role": "assistant",
                                        "content": reply, "ts": datetime.now(timezone.utc).isoformat()})
    return {"reply": reply}


# ---------------- Notifications ----------------
@api.get("/notifications")
async def notifications(user: dict = Depends(get_current_user)):
    items = [clean(n) for n in await db.notifications.find({"user_id": user["id"]}).sort("date", -1).to_list(100)]
    unread = sum(1 for n in items if not n["read"])
    return {"notifications": items, "unread": unread}


@api.post("/notifications/read")
async def mark_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------- Profile / Plus ----------------
@api.post("/profile/upgrade")
async def upgrade(user: dict = Depends(get_current_user)):
    await db.users.update_one({"_id": oid(user["id"])}, {"$set": {"plus": True}})
    return {"ok": True, "plus": True}


@api.post("/profile/reset-demo")
async def reset_demo(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"_id": oid(user["id"])})
    await seed_user_data(user["id"], u.get("primary_goal", "Save more"), u.get("banks"))
    return {"ok": True}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)


@app.on_event("shutdown")
async def shutdown():
    client.close()
