import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="wc-app-bg min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <span className="font-head font-extrabold text-lg">Wealth Coach</span>
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          data-testid="header-login-btn"
          className="text-slate-300 hover:text-white rounded-full"
        >
          Log In
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 text-sm font-medium"
        >
          <Sparkles size={15} /> Personal finance, simplified
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-head text-4xl sm:text-6xl font-extrabold tracking-tight"
        >
          Wealth <span className="wc-gold-text">Coach</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg sm:text-xl text-slate-400 max-w-md"
        >
          Your money, explained. A personal financial coach that helps you make smarter decisions — without the jargon.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row gap-3 w-full max-w-sm"
        >
          <Button
            onClick={() => navigate("/register")}
            data-testid="get-started-btn"
            className="flex-1 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-base"
          >
            Get Started
          </Button>
          <Button
            onClick={() => navigate("/login")}
            data-testid="welcome-login-btn"
            variant="outline"
            className="flex-1 h-12 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-white text-base"
          >
            Log In
          </Button>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: Sparkles, t: "AI Insights", d: "Understand where your money really goes." },
            { icon: TrendingUp, t: "Smart Goals", d: "Reach savings targets faster." },
            { icon: ShieldCheck, t: "Health Score", d: "One simple number for your finances." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="wc-card p-5 text-left"
            >
              <f.icon className="text-amber-400 mb-3" size={22} />
              <div className="font-semibold">{f.t}</div>
              <div className="text-sm text-slate-400 mt-1">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
