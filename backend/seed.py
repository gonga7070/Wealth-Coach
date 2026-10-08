"""Demo financial data generation for Wealth Coach."""
import random
from datetime import datetime, timezone, timedelta

CATEGORIES = {
    "Housing": {"color": "#E0A458", "icon": "Home"},
    "Food": {"color": "#7FA68A", "icon": "ShoppingCart"},
    "Restaurants": {"color": "#D98E5A", "icon": "UtensilsCrossed"},
    "Shopping": {"color": "#B5879E", "icon": "ShoppingBag"},
    "Transportation": {"color": "#6E8CA0", "icon": "Car"},
    "Entertainment": {"color": "#9A8BB0", "icon": "Clapperboard"},
    "Bills": {"color": "#C96F6F", "icon": "ReceiptText"},
    "Health": {"color": "#6FA38B", "icon": "HeartPulse"},
    "Income": {"color": "#8AA77F", "icon": "Banknote"},
}

MERCHANTS = {
    "Housing": ["Oakwood Apartments"],
    "Food": ["Whole Foods", "Trader Joe's", "Safeway", "Costco"],
    "Restaurants": ["Chipotle", "Sweetgreen", "Blue Bottle Coffee", "The Cheesecake Factory", "Shake Shack", "Olive Garden"],
    "Shopping": ["Amazon", "Target", "Nike", "Apple Store", "Best Buy"],
    "Transportation": ["Uber", "Shell Gas", "Lyft", "Chevron"],
    "Entertainment": ["AMC Theatres", "Steam Games", "Ticketmaster"],
    "Bills": ["PG&E Electric", "Comcast Internet", "City Water"],
    "Health": ["CVS Pharmacy", "24 Hour Fitness"],
}


def _dt(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def build_demo_data(user_id, primary_goal="Save more"):
    accounts = [
        {"user_id": user_id, "name": "Everyday Checking", "type": "checking", "institution": "Chase", "mask": "4821", "balance": 4820.55},
        {"user_id": user_id, "name": "High-Yield Savings", "type": "savings", "institution": "Ally Bank", "mask": "9903", "balance": 12450.00},
        {"user_id": user_id, "name": "Sapphire Credit Card", "type": "credit", "institution": "Chase", "mask": "1178", "balance": -1842.30},
        {"user_id": user_id, "name": "Brokerage", "type": "investment", "institution": "Fidelity", "mask": "5521", "balance": 28730.40},
        {"user_id": user_id, "name": "Auto Loan", "type": "loan", "institution": "Capital One", "mask": "3300", "balance": -8600.00},
    ]
    return {"accounts": accounts}


def build_transactions(user_id, checking_id, credit_id):
    """Generate ~2 months of realistic transactions. amount negative = spend."""
    txns = []
    # Monthly income - two paychecks per month
    for days in [2, 16, 32, 46]:
        txns.append({
            "user_id": user_id, "account_id": checking_id, "merchant": "Acme Corp Payroll",
            "amount": 3200.00, "category": "Income", "date": _dt(days), "pending": False,
            "note": "Direct deposit",
        })
    # Rent
    for days in [1, 31]:
        txns.append({
            "user_id": user_id, "account_id": checking_id, "merchant": "Oakwood Apartments",
            "amount": -1850.00, "category": "Housing", "date": _dt(days), "pending": False, "note": "Monthly rent",
        })
    # Recurring subscriptions
    subs = [("Netflix", -15.49, "Entertainment"), ("Spotify", -11.99, "Entertainment"),
            ("PG&E Electric", -92.40, "Bills"), ("Comcast Internet", -79.99, "Bills"),
            ("24 Hour Fitness", -39.99, "Health"), ("iCloud+", -2.99, "Bills")]
    for days in [5, 35]:
        for name, amt, cat in subs:
            txns.append({"user_id": user_id, "account_id": checking_id, "merchant": name,
                         "amount": amt, "category": cat, "date": _dt(days + random.randint(0, 3)),
                         "pending": False, "note": "Recurring"})
    # Variable spending across last 55 days
    spend_cats = ["Food", "Restaurants", "Shopping", "Transportation", "Entertainment", "Health"]
    for day in range(0, 55):
        n = random.randint(0, 3)
        for _ in range(n):
            # Bias restaurants higher in the current month to create an insight
            cat = random.choices(spend_cats, weights=[3, 4, 2, 3, 1, 1])[0]
            merchant = random.choice(MERCHANTS[cat])
            base = {"Food": (25, 120), "Restaurants": (14, 75), "Shopping": (20, 180),
                    "Transportation": (8, 55), "Entertainment": (12, 60), "Health": (10, 45)}[cat]
            amt = -round(random.uniform(*base), 2)
            acct = credit_id if cat in ("Shopping", "Restaurants", "Entertainment") else checking_id
            txns.append({"user_id": user_id, "account_id": acct, "merchant": merchant,
                         "amount": amt, "category": cat, "date": _dt(day),
                         "pending": day == 0, "note": ""})
    return txns


def build_goals(user_id, primary_goal):
    goals = [
        {"user_id": user_id, "name": "Emergency Fund", "type": "emergency", "icon": "Shield",
         "target": 10000, "current": 6450, "monthly_contribution": 500,
         "deadline": _dt(-210), "color": "#10B981"},
        {"user_id": user_id, "name": "Bali Vacation", "type": "travel", "icon": "Plane",
         "target": 3000, "current": 1850, "monthly_contribution": 300,
         "deadline": _dt(-120), "color": "#F59E0B"},
        {"user_id": user_id, "name": "New Car", "type": "car", "icon": "Car",
         "target": 15000, "current": 4200, "monthly_contribution": 450,
         "deadline": _dt(-540), "color": "#6366F1"},
    ]
    return goals


def build_budget(user_id):
    return [
        {"user_id": user_id, "category": "Housing", "limit": 1900},
        {"user_id": user_id, "category": "Food", "limit": 500},
        {"user_id": user_id, "category": "Restaurants", "limit": 300},
        {"user_id": user_id, "category": "Transportation", "limit": 300},
        {"user_id": user_id, "category": "Entertainment", "limit": 150},
        {"user_id": user_id, "category": "Shopping", "limit": 200},
        {"user_id": user_id, "category": "Bills", "limit": 300},
    ]


def build_recurring(user_id):
    return [
        {"user_id": user_id, "name": "Rent", "amount": 1850.00, "cadence": "monthly", "category": "Housing", "next_date": _dt(-6), "is_subscription": False, "icon": "Home"},
        {"user_id": user_id, "name": "Netflix", "amount": 15.49, "cadence": "monthly", "category": "Entertainment", "next_date": _dt(-2), "is_subscription": True, "icon": "Clapperboard"},
        {"user_id": user_id, "name": "Spotify", "amount": 11.99, "cadence": "monthly", "category": "Entertainment", "next_date": _dt(-4), "is_subscription": True, "icon": "Music"},
        {"user_id": user_id, "name": "Comcast Internet", "amount": 79.99, "cadence": "monthly", "category": "Bills", "next_date": _dt(-9), "is_subscription": False, "icon": "Wifi"},
        {"user_id": user_id, "name": "PG&E Electric", "amount": 92.40, "cadence": "monthly", "category": "Bills", "next_date": _dt(-11), "is_subscription": False, "icon": "Zap"},
        {"user_id": user_id, "name": "24 Hour Fitness", "amount": 39.99, "cadence": "monthly", "category": "Health", "next_date": _dt(-1), "is_subscription": True, "icon": "Dumbbell"},
        {"user_id": user_id, "name": "iCloud+", "amount": 2.99, "cadence": "monthly", "category": "Bills", "next_date": _dt(-3), "is_subscription": True, "icon": "Cloud"},
        {"user_id": user_id, "name": "Car Insurance", "amount": 128.00, "cadence": "monthly", "category": "Bills", "next_date": _dt(-14), "is_subscription": False, "icon": "ShieldCheck"},
    ]


def build_notifications(user_id):
    return [
        {"user_id": user_id, "title": "Your savings grew this month", "body": "You added $500 to your Emergency Fund. Nice work!", "type": "positive", "read": False, "date": _dt(0), "icon": "TrendingUp"},
        {"user_id": user_id, "title": "Credit card payment due soon", "body": "Your Sapphire card payment of $1,842 is due in 3 days.", "type": "warning", "read": False, "date": _dt(1), "icon": "CreditCard"},
        {"user_id": user_id, "title": "Restaurant spending is higher than usual", "body": "You've spent $428 on restaurants, about $128 more than normal.", "type": "alert", "read": False, "date": _dt(1), "icon": "UtensilsCrossed"},
        {"user_id": user_id, "title": "You're close to your vacation goal", "body": "Bali Vacation is 62% funded. Keep it up!", "type": "positive", "read": True, "date": _dt(3), "icon": "Plane"},
    ]
