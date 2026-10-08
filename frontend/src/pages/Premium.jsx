import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { OwlAvatar } from "@/components/OwlMascot";
import { Button } from "@/components/ui/button";
import {
  Check, Infinity as InfIcon, Sparkles, LineChart, RefreshCw, FileText, Target, Activity, Crown,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: InfIcon, t: "Unlimited AI coaching", d: "Ask Hoot as much as you want." },
  { icon: Sparkles, t: "Advanced insights", d: "Deeper patterns in your spending." },
  { icon: LineChart, t: "Advanced analytics", d: "Trends across months and categories." },
  { icon: RefreshCw, t: "Subscription detection", d: "Automatically flag forgotten subs." },
  { icon: FileText, t: "Personalized reports", d: "Monthly summaries made for you." },
  { icon: Target, t: "Advanced goals", d: "Smart projections and milestones." },
  { icon: Activity, t: "Financial health trends", d: "Watch your score grow over time." },
];

export default function Premium() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    setLoading(true);
    try {
      await api.post("/profile/upgrade");
      setUser({ ...user, plus: true });
      toast.success("Welcome to Wealth Coach Plus! 🎉");
      navigate("/app");
    } catch {
      toast.error("Couldn't upgrade right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="wc-card p-8 text-center"
      >
        <OwlAvatar size={72} float className="mx-auto mb-5" />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-full mb-4">
          <Crown size={14} /> Wealth Coach Plus
        </span>
        <h1 className="font-head text-3xl font-extrabold">Unlock your full coach</h1>
        <p className="text-slate-400 mt-2 max-w-sm mx-auto">
          Everything you need to truly understand and grow your money — guided by Hoot.
        </p>
        <div className="mt-6 flex items-end justify-center gap-1">
          <span className="font-num text-4xl font-extrabold wc-gold-text">$9</span>
          <span className="text-slate-400 mb-1">/month</span>
        </div>

        {user?.plus ? (
          <div className="mt-6 inline-flex items-center gap-2 text-emerald-400 font-semibold">
            <Check size={18} /> You're on Plus — enjoy!
          </div>
        ) : (
          <Button
            onClick={upgrade}
            disabled={loading}
            data-testid="upgrade-btn"
            className="mt-6 h-12 px-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-base"
          >
            {loading ? "Upgrading…" : "Upgrade now"}
          </Button>
        )}
        <p className="text-xs text-slate-600 mt-3">Demo upgrade — no payment required.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="wc-card p-5 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/12 text-amber-400 grid place-items-center shrink-0">
              <f.icon size={20} />
            </div>
            <div>
              <div className="font-semibold">{f.t}</div>
              <div className="text-sm text-slate-400 mt-0.5">{f.d}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
