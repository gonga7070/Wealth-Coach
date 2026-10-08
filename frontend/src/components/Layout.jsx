import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Wallet, PieChart, Brain, Target, Sliders, RefreshCw,
  PiggyBank, TrendingUp, MessageSquare, Bell, User, Crown, LogOut, Menu, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwlAvatar } from "@/components/OwlMascot";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import api from "@/lib/api";

const NAV = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/money", label: "Money", icon: Wallet },
  { to: "/app/spending", label: "Spending", icon: PieChart },
  { to: "/app/insights", label: "Insights", icon: Brain },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/budget", label: "Spending Plan", icon: Sliders },
  { to: "/app/recurring", label: "Recurring", icon: RefreshCw },
  { to: "/app/savings", label: "Savings", icon: PiggyBank },
  { to: "/app/investing", label: "Investing", icon: TrendingUp },
  { to: "/app/coach", label: "Ask Coach", icon: MessageSquare },
  { to: "/app/notifications", label: "Alerts", icon: Bell },
  { to: "/app/profile", label: "Profile", icon: User },
];

const BOTTOM = [NAV[0], NAV[1], NAV[3], NAV[4]];

function NavItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-amber-500/12 text-amber-300 border border-amber-500/25"
            : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`
      }
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    api.get("/notifications").then((r) => setUnread(r.data.unread)).catch(() => {});
  }, []);

  return (
    <div className="wc-app-bg min-h-screen flex text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/8 p-4 sticky top-0 h-screen">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-3 px-2 mb-6"
          data-testid="brand-home-btn"
        >
          <OwlAvatar size={40} />
          <div className="text-left">
            <div className="font-head font-extrabold text-lg leading-none">Wealth Coach</div>
            <div className="text-[11px] text-slate-500">Your money, explained.</div>
          </div>
        </button>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>
        <button
          onClick={() => navigate("/app/premium")}
          data-testid="sidebar-plus-btn"
          className="mt-3 flex items-center gap-2 justify-center rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-400 font-medium text-sm py-2.5 hover:bg-amber-500/14 transition"
        >
          <Crown size={15} /> Wealth Coach Plus
        </button>
        <button
          onClick={() => { logout(); navigate("/"); }}
          data-testid="logout-btn"
          className="mt-2 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-rose-400 hover:bg-white/5 transition"
        >
          <LogOut size={18} /> Log out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 wc-glass border-b border-white/8 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <OwlAvatar size={34} />
            <span className="font-head font-bold">Wealth Coach</span>
          </div>
          <div className="hidden lg:block text-sm text-slate-400">
            Welcome back, <span className="text-white font-semibold">{user?.name?.split(" ")[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/app/notifications")}
              className="relative p-2.5 rounded-full hover:bg-white/5 transition"
              data-testid="topbar-notifications-btn"
            >
              <Bell size={19} className="text-slate-300" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => navigate("/app/profile")}
              className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold grid place-items-center text-sm"
              data-testid="topbar-avatar-btn"
            >
              {user?.name?.[0]?.toUpperCase() || "W"}
            </button>
            {/* Mobile more menu */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2.5 rounded-full hover:bg-white/5" data-testid="mobile-menu-btn">
                  <Menu size={20} className="text-slate-300" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="wc-glass border-white/10 w-72 p-4 overflow-y-auto">
                <div className="flex items-center gap-3 mb-5">
                  <OwlAvatar size={38} />
                  <span className="font-head font-bold text-lg">Menu</span>
                </div>
                <nav className="space-y-1">
                  {NAV.map((item) => (
                    <NavItem key={item.to} item={item} onClick={() => setMoreOpen(false)} />
                  ))}
                  <NavItem item={{ to: "/app/premium", label: "Wealth Coach Plus", icon: Crown }} onClick={() => setMoreOpen(false)} />
                </nav>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="mt-4 w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-white/5"
                  data-testid="mobile-logout-btn"
                >
                  <LogOut size={18} /> Log out
                </button>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 wc-glass border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {BOTTOM.slice(0, 2).map((item) => (
          <BottomLink key={item.to} item={item} />
        ))}
        <button
          onClick={() => navigate("/app/coach")}
          data-testid="bottomnav-coach"
          className="flex flex-col items-center -mt-6"
        >
          <OwlAvatar size={46} />
          <span className="text-[10px] text-amber-300 font-medium mt-0.5">Coach</span>
        </button>
        {BOTTOM.slice(2).map((item) => (
          <BottomLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}

function BottomLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      data-testid={`bottomnav-${item.label.toLowerCase()}`}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium ${
          isActive ? "text-amber-300" : "text-slate-500"
        }`
      }
    >
      <Icon size={20} />
      {item.label}
    </NavLink>
  );
}
