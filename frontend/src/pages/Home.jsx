import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { fmt, fmtC, dateLabel } from "@/lib/format";
import { RingProgress, Bar } from "@/components/Charts";
import { OwlBubble } from "@/components/OwlMascot";
import { Icon } from "@/lib/icons";
import {
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, ChevronRight, Brain, Target,
} from "lucide-react";

const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading your money…</div>;
  const { overview: o, primary_goal, top_insight, recent_transactions, headline, health_label } = data;
  const up = o.spend_change_pct <= 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <p className="text-sm text-slate-400">Your money</p>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold mt-0.5">{headline}</h1>
      </motion.div>

      {/* Net worth + health score */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wc-card p-6 md:col-span-2 relative overflow-hidden" data-testid="networth-card">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)" }} />
          <p className="text-xs uppercase tracking-wide text-slate-400">Net worth</p>
          <div className="font-num text-4xl sm:text-5xl font-extrabold mt-2">{fmt(o.net_worth)}</div>
          <div className={`inline-flex items-center gap-1 mt-3 text-sm font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {up ? "Spending down" : "Spending up"} {Math.abs(o.spend_change_pct)}% this month
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Mini label="Available" value={fmt(o.available)} />
            <Mini label="Spent" value={fmt(o.monthly_spending)} />
            <Mini label="Saved" value={`${o.savings_rate}%`} />
          </div>
        </div>

        <button
          onClick={() => navigate("/app/insights")}
          data-testid="health-score-card"
          className="wc-card wc-card-hover p-6 flex flex-col items-center justify-center text-center"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Financial health</p>
          <RingProgress value={o.health_score} label={o.health_score} sub="of 100" color="#10B981" size={130} />
          <div className="mt-3 text-emerald-400 font-semibold">{health_label}</div>
        </button>
      </motion.div>

      {/* Owl insight */}
      {top_insight && (
        <motion.div variants={item}>
          <OwlBubble>
            {top_insight.summary}{" "}
            <button
              onClick={() => navigate("/app/insights")}
              className="text-amber-300 font-semibold hover:underline"
              data-testid="owl-insight-link"
            >
              See insights →
            </button>
          </OwlBubble>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary goal */}
        {primary_goal && (
          <button
            onClick={() => navigate(`/app/goals/${primary_goal.id}`)}
            data-testid="home-goal-card"
            className="wc-card wc-card-hover p-6 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <Target size={16} className="text-amber-400" /> Main goal
              </span>
              <ChevronRight size={18} className="text-slate-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: `${primary_goal.color}22`, color: primary_goal.color }}>
                <Icon name={primary_goal.icon} size={22} />
              </div>
              <div>
                <div className="font-semibold">{primary_goal.name}</div>
                <div className="font-num text-sm text-slate-400">
                  {fmt(primary_goal.current)} / {fmt(primary_goal.target)}
                </div>
              </div>
            </div>
            <Bar className="mt-4" value={(primary_goal.current / primary_goal.target) * 100} color={primary_goal.color} />
          </button>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          <QuickAction icon={Wallet} label="Accounts" onClick={() => navigate("/app/money")} testid="quick-accounts" />
          <QuickAction icon={Brain} label="Insights" onClick={() => navigate("/app/insights")} testid="quick-insights" />
          <QuickAction icon={TrendingUp} label="Investing" onClick={() => navigate("/app/investing")} testid="quick-investing" />
          <QuickAction icon={Target} label="Goals" onClick={() => navigate("/app/goals")} testid="quick-goals" />
        </div>
      </motion.div>

      {/* Recent transactions */}
      <motion.div variants={item} className="wc-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-head font-bold text-lg">Recent activity</h3>
          <button onClick={() => navigate("/app/money")} className="text-sm text-amber-400 hover:underline" data-testid="see-all-txns">
            See all
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {recent_transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3" data-testid="home-txn-row">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 grid place-items-center text-slate-300 text-sm font-semibold shrink-0">
                  {t.merchant[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.merchant}</div>
                  <div className="text-xs text-slate-500">{t.category} · {dateLabel(t.date)}</div>
                </div>
              </div>
              <div className={`font-num font-semibold ${t.amount > 0 ? "text-emerald-400" : "text-slate-200"}`}>
                {t.amount > 0 ? "+" : ""}{fmtC(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-num font-bold mt-1 text-sm sm:text-base">{value}</div>
    </div>
  );
}

function QuickAction({ icon: Ic, label, onClick, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className="wc-card wc-card-hover p-5 flex flex-col items-start gap-3">
      <Ic className="text-amber-400" size={22} />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );
}
