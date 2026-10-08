"""Wealth Coach backend API tests - comprehensive endpoint coverage."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wealth-coach-45.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": "alex@demo.com", "password": "password123"})
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


@pytest.fixture(scope="session")
def new_user():
    """Register a fresh user, do onboarding, return token+headers."""
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "pw12345!"})
    assert r.status_code == 200, r.text
    data = r.json()
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    # Onboarding with demo data
    r2 = requests.post(f"{API}/onboarding",
                       json={"primary_goal": "Save more", "help_with": ["Save more"], "use_demo": True},
                       headers=headers)
    assert r2.status_code == 200, r2.text
    return {"email": email, "token": token, "headers": headers}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_demo_user(self):
        r = requests.post(f"{API}/auth/login", json={"email": "alex@demo.com", "password": "password123"})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["email"] == "alex@demo.com"
        assert d["user"]["onboarded"] is True

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "alex@demo.com", "password": "wrong"})
        assert r.status_code == 401

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register",
                          json={"name": "x", "email": "alex@demo.com", "password": "password123"})
        assert r.status_code == 400

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, demo_headers):
        r = requests.get(f"{API}/auth/me", headers=demo_headers)
        assert r.status_code == 200
        assert r.json()["email"] == "alex@demo.com"


# ---------------- Dashboard / Accounts ----------------
class TestDashboard:
    def test_dashboard(self, demo_headers):
        r = requests.get(f"{API}/dashboard", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("overview", "health_label", "recent_transactions", "accounts", "headline", "name"):
            assert k in d
        ov = d["overview"]
        for k in ("net_worth", "available", "savings", "monthly_income", "monthly_spending",
                  "savings_rate", "health_score", "categories"):
            assert k in ov
        assert isinstance(d["recent_transactions"], list)
        assert isinstance(d["accounts"], list) and len(d["accounts"]) > 0

    def test_accounts_list(self, demo_headers):
        r = requests.get(f"{API}/accounts", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        assert "accounts" in d and len(d["accounts"]) > 0
        assert "net_worth" in d

    def test_account_detail(self, demo_headers):
        accts = requests.get(f"{API}/accounts", headers=demo_headers).json()["accounts"]
        aid = accts[0]["id"]
        r = requests.get(f"{API}/accounts/{aid}", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["account"]["id"] == aid
        assert "transactions" in d and "income" in d and "spending" in d


# ---------------- Transactions ----------------
class TestTransactions:
    def test_list(self, demo_headers):
        r = requests.get(f"{API}/transactions", headers=demo_headers)
        assert r.status_code == 200
        txns = r.json()["transactions"]
        assert len(txns) > 0
        assert "account_name" in txns[0]

    def test_detail(self, demo_headers):
        txns = requests.get(f"{API}/transactions", headers=demo_headers).json()["transactions"]
        tid = txns[0]["id"]
        r = requests.get(f"{API}/transactions/{tid}", headers=demo_headers)
        assert r.status_code == 200
        assert r.json()["id"] == tid

    def test_update_category(self, demo_headers):
        txns = requests.get(f"{API}/transactions", headers=demo_headers).json()["transactions"]
        # pick a non-income txn
        txn = next(t for t in txns if t["amount"] < 0)
        tid = txn["id"]
        original = txn["category"]
        new_cat = "Groceries" if original != "Groceries" else "Dining"
        r = requests.patch(f"{API}/transactions/{tid}/category",
                           json={"category": new_cat}, headers=demo_headers)
        assert r.status_code == 200
        # Verify persisted
        r2 = requests.get(f"{API}/transactions/{tid}", headers=demo_headers)
        assert r2.json()["category"] == new_cat
        # restore
        requests.patch(f"{API}/transactions/{tid}/category",
                       json={"category": original}, headers=demo_headers)


# ---------------- Spending / Insights ----------------
class TestSpendingInsights:
    def test_spending(self, demo_headers):
        r = requests.get(f"{API}/spending", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        assert "categories" in d and "total" in d

    def test_insights(self, demo_headers):
        r = requests.get(f"{API}/insights", headers=demo_headers)
        assert r.status_code == 200
        assert isinstance(r.json()["insights"], list)


# ---------------- Goals ----------------
class TestGoals:
    def test_list(self, demo_headers):
        r = requests.get(f"{API}/goals", headers=demo_headers)
        assert r.status_code == 200
        assert len(r.json()["goals"]) > 0

    def test_create_contribute_update_delete(self, demo_headers):
        payload = {"name": "TEST_Goal", "type": "custom", "icon": "Target",
                   "target": 1000, "current": 0, "monthly_contribution": 100,
                   "deadline": "2026-12-31", "color": "#F59E0B"}
        r = requests.post(f"{API}/goals", json=payload, headers=demo_headers)
        assert r.status_code == 200
        g = r.json()
        gid = g["id"]
        assert g["name"] == "TEST_Goal" and g["target"] == 1000

        # GET
        r2 = requests.get(f"{API}/goals/{gid}", headers=demo_headers)
        assert r2.status_code == 200 and r2.json()["id"] == gid

        # Contribute partial
        r3 = requests.post(f"{API}/goals/{gid}/contribute", json={"amount": 400}, headers=demo_headers)
        assert r3.status_code == 200
        assert r3.json()["goal"]["current"] == 400
        assert r3.json()["reached"] is False

        # Contribute to reach
        r4 = requests.post(f"{API}/goals/{gid}/contribute", json={"amount": 1000}, headers=demo_headers)
        assert r4.json()["reached"] is True
        assert r4.json()["goal"]["current"] == 1000  # capped

        # Update
        r5 = requests.patch(f"{API}/goals/{gid}", json={"target": 2000}, headers=demo_headers)
        assert r5.status_code == 200 and r5.json()["target"] == 2000

        # Delete
        r6 = requests.delete(f"{API}/goals/{gid}", headers=demo_headers)
        assert r6.status_code == 200
        r7 = requests.get(f"{API}/goals/{gid}", headers=demo_headers)
        assert r7.status_code == 404


# ---------------- Budget ----------------
class TestBudget:
    def test_get_and_update(self, demo_headers):
        r = requests.get(f"{API}/budget", headers=demo_headers)
        assert r.status_code == 200
        budget = r.json()["budget"]
        assert len(budget) > 0
        cat = budget[0]["category"]
        orig = budget[0]["limit"]
        new_limit = orig + 50
        r2 = requests.patch(f"{API}/budget", json={"category": cat, "limit": new_limit}, headers=demo_headers)
        assert r2.status_code == 200
        # Verify
        r3 = requests.get(f"{API}/budget", headers=demo_headers)
        updated = next(b for b in r3.json()["budget"] if b["category"] == cat)
        assert updated["limit"] == new_limit
        # restore
        requests.patch(f"{API}/budget", json={"category": cat, "limit": orig}, headers=demo_headers)


# ---------------- Recurring / Savings / Investing ----------------
class TestOtherEndpoints:
    def test_recurring(self, demo_headers):
        r = requests.get(f"{API}/recurring", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("items", "total_monthly", "subscriptions_total", "subscription_count"):
            assert k in d

    def test_savings(self, demo_headers):
        r = requests.get(f"{API}/savings", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_savings", "savings_rate", "monthly_contribution", "recommended_target"):
            assert k in d

    def test_investing(self, demo_headers):
        r = requests.get(f"{API}/investing", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        assert len(d["lessons"]) >= 5
        assert "holdings" in d


# ---------------- Coach ----------------
class TestCoach:
    def test_history_initial(self, demo_headers):
        r = requests.get(f"{API}/coach/history", headers=demo_headers)
        assert r.status_code == 200
        assert "messages" in r.json()

    def test_chat_reply(self, demo_headers):
        r = requests.post(f"{API}/coach/chat",
                          json={"message": "Can I afford a $700 vacation?"},
                          headers=demo_headers, timeout=60)
        assert r.status_code == 200
        reply = r.json()["reply"]
        assert isinstance(reply, str) and len(reply) > 10
        # history should contain the message
        h = requests.get(f"{API}/coach/history", headers=demo_headers).json()["messages"]
        assert any("vacation" in m["content"].lower() for m in h if m["role"] == "user")


# ---------------- Notifications / Profile ----------------
class TestNotificationsProfile:
    def test_notifications_and_mark_read(self, demo_headers):
        r = requests.get(f"{API}/notifications", headers=demo_headers)
        assert r.status_code == 200
        d = r.json()
        assert "notifications" in d and "unread" in d
        r2 = requests.post(f"{API}/notifications/read", headers=demo_headers)
        assert r2.status_code == 200
        r3 = requests.get(f"{API}/notifications", headers=demo_headers)
        assert r3.json()["unread"] == 0

    def test_upgrade(self, new_user):
        r = requests.post(f"{API}/profile/upgrade", headers=new_user["headers"])
        assert r.status_code == 200 and r.json()["plus"] is True
        me = requests.get(f"{API}/auth/me", headers=new_user["headers"]).json()
        assert me["plus"] is True


# ---------------- Register + Onboarding flow (via fixture) ----------------
class TestRegisterOnboarding:
    def test_new_user_has_seed_data(self, new_user):
        r = requests.get(f"{API}/dashboard", headers=new_user["headers"])
        assert r.status_code == 200
        d = r.json()
        assert len(d["accounts"]) > 0
        assert d["overview"]["net_worth"] != 0

    def test_protected_without_token(self):
        for ep in ["/dashboard", "/accounts", "/goals", "/budget", "/recurring", "/savings", "/investing"]:
            r = requests.get(f"{API}{ep}")
            assert r.status_code == 401, f"{ep} should require auth"
