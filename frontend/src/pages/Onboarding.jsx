import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { OwlBubble } from "@/components/OwlMascot";
import { Button } from "@/components/ui/button";
import {
  PiggyBank, CreditCard, Home, Car, Plane, TrendingUp, Check, Database, Link2,
} from "lucide-react";
import { toast } from "sonner";

const GOALS = [
  { id: "Save more", label: "Save more", icon: PiggyBank },
  { id: "Pay off debt", label: "Pay off debt", icon: CreditCard },
  { id: "Buy a home", label: "Buy a home", icon: Home },
  { id: "Buy a car", label: "Buy a car", icon: Car },
  { id: "Travel", label: "Travel", icon: Plane },
  { id: "Invest", label: "Start investing", icon: TrendingUp },
];

const HELP = [
  "Understand my spending",
  "Build an emergency fund",
  "Stick to a budget",
  "Track my subscriptions",
  "Learn about investing",
  "Reach a savings goal",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [help, setHelp] = useState([]);
  const [loading, setLoading] = useState(false);

  if (user === false) { navigate("/login"); return null; }

  const toggleHelp = (h) =>
    setHelp((p) => (p.includes(h) ? p.filter((x) => x !== h) : [...p, h]));

  const finish = async () => {
    setLoading(true);
    try {
      await api.post("/onboarding", { primary_goal: goal, help_with: help, use_demo: true });
      setUser({ ...user, onboarded: true });
      navigate("/app");
    } catch {
      toast.error("Couldn't finish setup. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 1: goal
    <div key="s1">
      <h1 className="font-head text-3xl font-extrabold">What's your biggest money goal?</h1>
      <p className="text-slate-400 mt-2 mb-7">Pick one. You can always change it later.</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            data-testid={`goal-${g.id.toLowerCase().replace(/ /g, "-")}`}
            className={`wc-card p-5 text-left transition-all ${
              goal === g.id ? "border-amber-500/60 bg-amber-500/10" : "wc-card-hover"
            }`}
          >
            <g.icon className={goal === g.id ? "text-amber-400" : "text-slate-400"} size={24} />
            <div className="font-semibold mt-3">{g.label}</div>
          </button>
        ))}
      </div>
    </div>,
    // Step 2: help
    <div key="s2">
      <h1 className="font-head text-3xl font-extrabold">What do you want help with?</h1>
      <p className="text-slate-400 mt-2 mb-7">Choose as many as you like.</p>
      <div className="grid grid-cols-1 gap-2.5">
        {HELP.map((h) => (
          <button
            key={h}
            onClick={() => toggleHelp(h)}
            data-testid={`help-${h.toLowerCase().replace(/ /g, "-")}`}
            className={`wc-card px-5 py-4 flex items-center justify-between text-left transition-all ${
              help.includes(h) ? "border-amber-500/60 bg-amber-500/10" : "wc-card-hover"
            }`}
          >
            <span className="font-medium">{h}</span>
            <span className={`w-6 h-6 rounded-full grid place-items-center border ${
              help.includes(h) ? "bg-amber-500 border-amber-500 text-slate-950" : "border-white/20"
            }`}>
              {help.includes(h) && <Check size={14} />}
            </span>
          </button>
        ))}
      </div>
    </div>,
    // Step 3: connect
    <div key="s3">
      <h1 className="font-head text-3xl font-extrabold">Connect your accounts</h1>
      <p className="text-slate-400 mt-2 mb-7">
        We'll load a realistic demo so you can explore everything right away.
      </p>
      <div className="space-y-3">
        <button
          onClick={finish}
          disabled={loading}
          data-testid="use-demo-btn"
          className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left border-amber-500/40"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 grid place-items-center text-amber-400">
            <Database size={22} />
          </div>
          <div>
            <div className="font-semibold">Use Demo Data</div>
            <div className="text-sm text-slate-400">Explore with realistic accounts & transactions</div>
          </div>
        </button>
        <button
          onClick={() => { toast("Bank linking is demo-only — loading demo data for you"); finish(); }}
          disabled={loading}
          data-testid="connect-accounts-btn"
          className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 grid place-items-center text-indigo-400">
            <Link2 size={22} />
          </div>
          <div>
            <div className="font-semibold">Connect Accounts</div>
            <div className="text-sm text-slate-400">Securely link your bank (demo)</div>
          </div>
        </button>
      </div>
      <div className="mt-7">
        <OwlBubble>
          Welcome aboard! I'm Athena. I'll help you understand your money and reach{" "}
          <span className="text-amber-300 font-semibold">{goal || "your goals"}</span>. Let's dive in.
        </OwlBubble>
      </div>
    </div>,
  ];

  const canNext = step === 0 ? !!goal : true;

  return (
    <div className="wc-app-bg min-h-screen flex flex-col">
      <div className="px-6 pt-6">
        <div className="max-w-lg mx-auto flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-amber-500" : "bg-white/10"}`} />
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          {step < 2 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="rounded-full border-white/15 bg-white/5"
                  data-testid="onboarding-back-btn"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                data-testid="onboarding-next-btn"
                className="flex-1 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
