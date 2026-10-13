import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { OwlBubble } from "@/components/OwlMascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PiggyBank, CreditCard, Home, Car, Plane, TrendingUp, Check, Database, Landmark, User,
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

const COUNTRIES = [
  { c: "United States", f: "🇺🇸" },
  { c: "Canada", f: "🇨🇦" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || "");
  const [country, setCountry] = useState(user?.country || "");
  const [goal, setGoal] = useState("");
  const [help, setHelp] = useState([]);
  const [loading, setLoading] = useState(false);

  if (user === false) { navigate("/login"); return null; }

  const toggleHelp = (h) =>
    setHelp((p) => (p.includes(h) ? p.filter((x) => x !== h) : [...p, h]));

  const finish = async (mode) => {
    // mode: "connect" | "manual" | "sample"
    setLoading(true);
    const useDemo = mode === "sample";
    try {
      await api.post("/onboarding", {
        primary_goal: goal, help_with: help, use_demo: useDemo,
        name: name.trim(), country, banks: [],
      });
      setUser({ ...user, onboarded: true, name: name.trim(), country, demo_mode: useDemo });
      navigate(mode === "sample" ? "/app" : "/app/money");
    } catch {
      toast.error("Couldn't finish setup. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const TOTAL = 5;

  const steps = [
    // Step 0: name
    <div key="s0">
      <div className="w-12 h-12 rounded-xl bg-amber-500/15 grid place-items-center text-amber-400 mb-4"><User size={24} /></div>
      <h1 className="font-head text-3xl font-extrabold">First, what should we call you?</h1>
      <p className="text-slate-400 mt-2 mb-7">Hoot likes to keep things personal.</p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="onboarding-name-input"
        placeholder="Your name"
        className="h-12 bg-white/5 border-white/12 rounded-xl text-lg"
        autoFocus
      />
    </div>,
    // Step 1: country
    <div key="s1">
      <h1 className="font-head text-3xl font-extrabold">Where are you based?</h1>
      <p className="text-slate-400 mt-2 mb-6">This helps us tailor currency and tips.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
        {COUNTRIES.map((co) => (
          <button
            key={co.c}
            onClick={() => { setCountry(co.c); setBanks([]); }}
            data-testid={`country-${co.c.toLowerCase().replace(/ /g, "-")}`}
            className={`wc-card p-3.5 flex items-center gap-2.5 text-left transition-all ${
              country === co.c ? "border-amber-500/60 bg-amber-500/10" : "wc-card-hover"
            }`}
          >
            <span className="text-xl">{co.f}</span>
            <span className="text-sm font-medium truncate">{co.c}</span>
          </button>
        ))}
      </div>
    </div>,
    // Step 2: goal
    <div key="s2">
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
    // Step 3: help
    <div key="s3">
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
    // Step 4: how to start
    <div key="s4">
      <h1 className="font-head text-3xl font-extrabold">How do you want to start?</h1>
      <p className="text-slate-400 mt-2 mb-5">Your dashboard uses only your real data. Nothing is simulated unless you choose sample data.</p>
      <div className="space-y-3">
        <button
          onClick={() => finish("connect")}
          disabled={loading}
          data-testid="start-connect-btn"
          className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left border-amber-500/30"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 grid place-items-center shrink-0"><Landmark size={22} /></div>
          <div className="flex-1">
            <div className="font-semibold">Connect a bank</div>
            <div className="text-sm text-slate-400">Securely link your real accounts via Plaid. We never see your login.</div>
          </div>
        </button>
        <button
          onClick={() => finish("manual")}
          disabled={loading}
          data-testid="start-manual-btn"
          className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-white/5 text-slate-300 grid place-items-center shrink-0"><User size={22} /></div>
          <div className="flex-1">
            <div className="font-semibold">Add accounts manually</div>
            <div className="text-sm text-slate-400">Enter balances and transactions yourself — no bank needed.</div>
          </div>
        </button>
        <button
          onClick={() => finish("sample")}
          disabled={loading}
          data-testid="start-sample-btn"
          className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-white/5 text-slate-300 grid place-items-center shrink-0"><Database size={22} /></div>
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">Explore with sample data <span className="text-[10px] uppercase tracking-wide bg-white/10 text-slate-300 rounded-full px-2 py-0.5">Demo</span></div>
            <div className="text-sm text-slate-400">Try the app with realistic example data you can clear anytime.</div>
          </div>
        </button>
      </div>
      <div className="mt-6">
        <OwlBubble>
          Nice to meet you{name ? `, ${name.split(" ")[0]}` : ""}! I'm Hoot. I'll help you reach{" "}
          <span className="text-amber-400 font-semibold">{goal || "your goals"}</span>. Let's dive in.
        </OwlBubble>
      </div>
    </div>,
  ];

  const canNext = step === 0 ? name.trim().length > 1 : step === 1 ? !!country : step === 2 ? !!goal : true;

  return (
    <div className="wc-app-bg min-h-screen flex flex-col">
      <div className="px-6 pt-6">
        <div className="max-w-lg mx-auto flex gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => (
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
            {step < TOTAL - 1 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                data-testid="onboarding-next-btn"
                className="flex-1 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
