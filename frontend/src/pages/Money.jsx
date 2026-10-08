import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { ChevronRight, Wallet, PiggyBank, CreditCard, LineChart, Landmark } from "lucide-react";

const TYPE_META = {
  checking: { icon: Wallet, color: "#10B981", label: "Checking" },
  savings: { icon: PiggyBank, color: "#F59E0B", label: "Savings" },
  credit: { icon: CreditCard, color: "#F43F5E", label: "Credit Card" },
  investment: { icon: LineChart, color: "#6366F1", label: "Investment" },
  loan: { icon: Landmark, color: "#A855F7", label: "Loan" },
};

export default function Money() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/accounts").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading accounts…</div>;

  const groups = {};
  data.accounts.forEach((a) => {
    (groups[a.type] = groups[a.type] || []).push(a);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Your money</h1>
        <p className="text-slate-400 mt-1">Everything you own and owe, in one place.</p>
      </div>

      <div className="wc-card p-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">Total net worth</p>
        <div className="font-num text-4xl font-extrabold mt-1">{fmt(data.net_worth)}</div>
      </div>

      {Object.entries(TYPE_META).map(([type, meta]) =>
        groups[type] ? (
          <div key={type}>
            <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">{meta.label}</h3>
            <div className="space-y-3">
              {groups[type].map((a) => (
                <motion.button
                  key={a.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/app/money/${a.id}`)}
                  data-testid={`account-${a.id}`}
                  className="w-full wc-card wc-card-hover p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: `${meta.color}22`, color: meta.color }}>
                      <meta.icon size={22} />
                    </div>
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.institution} ·••{a.mask}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-num font-bold ${a.balance < 0 ? "text-rose-400" : ""}`}>{fmt(a.balance)}</span>
                    <ChevronRight size={18} className="text-slate-600" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
