import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { OwlAvatar } from "@/components/OwlMascot";
import {
  User, Link2, Bell, Shield, Lock, Brain, Crown, Download, Trash2, RefreshCw, ChevronRight, LogOut,
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const resetDemo = async () => {
    await api.post("/profile/reset-demo");
    toast.success("Demo data refreshed");
  };

  const groups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal information", sub: user?.email },
        { icon: Link2, label: "Connected accounts", sub: "5 demo accounts" },
        { icon: Bell, label: "Notifications", onClick: () => navigate("/app/notifications") },
      ],
    },
    {
      title: "Security & Privacy",
      items: [
        { icon: Shield, label: "Security" },
        { icon: Lock, label: "Privacy" },
        { icon: Brain, label: "AI preferences" },
      ],
    },
    {
      title: "Data",
      items: [
        { icon: Download, label: "Export data", onClick: () => toast("Your data export is being prepared (demo)") },
        { icon: RefreshCw, label: "Reset demo data", onClick: resetDemo },
        { icon: Trash2, label: "Delete account", danger: true, onClick: () => toast("Account deletion is disabled in demo") },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Profile</h1>

      <div className="wc-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 grid place-items-center text-2xl font-extrabold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-head font-bold text-lg truncate">{user?.name}</div>
          <div className="text-sm text-slate-400 truncate">{user?.email}</div>
        </div>
        {user?.plus && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-full">
            <Crown size={14} /> Plus
          </span>
        )}
      </div>

      {!user?.plus && (
        <button onClick={() => navigate("/app/premium")} data-testid="profile-plus-btn" className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left border-amber-500/30">
          <OwlAvatar size={44} />
          <div className="flex-1">
            <div className="font-semibold">Upgrade to Wealth Coach Plus</div>
            <div className="text-sm text-slate-400">Unlimited coaching & advanced insights</div>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </button>
      )}

      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">{g.title}</h3>
          <div className="wc-card divide-y divide-white/5 overflow-hidden">
            {g.items.map((it) => (
              <button
                key={it.label}
                onClick={it.onClick}
                data-testid={`profile-${it.label.toLowerCase().replace(/ /g, "-")}`}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition"
              >
                <it.icon size={20} className={it.danger ? "text-rose-400" : "text-slate-400"} />
                <div className="flex-1">
                  <div className={`font-medium ${it.danger ? "text-rose-400" : ""}`}>{it.label}</div>
                  {it.sub && <div className="text-xs text-slate-500">{it.sub}</div>}
                </div>
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => { logout(); navigate("/"); }} data-testid="profile-logout-btn" className="w-full wc-card p-4 flex items-center justify-center gap-2 text-rose-400 hover:bg-white/[0.03] transition">
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}
