import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { fmt, fmtC, dateLabel } from "@/lib/format";
import TransactionDialog from "@/components/TransactionDialog";
import { ArrowLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => api.get(`/accounts/${id}`).then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading account…</div>;
  const { account: a, transactions, income, spending } = data;

  const openTxn = (t) => setSelected({ ...t, account_name: a.name });

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/app/money")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white" data-testid="back-btn">
        <ArrowLeft size={16} /> Accounts
      </button>

      <div className="wc-card p-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">{account_type(a.type)} · {a.institution}</p>
        <h1 className="font-head text-xl font-bold mt-1">{a.name}</h1>
        <div className={`font-num text-4xl font-extrabold mt-2 ${a.balance < 0 ? "text-rose-400" : ""}`}>{fmt(a.balance)}</div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs"><ArrowUpRight size={14} /> Income</div>
            <div className="font-num font-bold mt-1">{fmt(income)}</div>
          </div>
          <div className="rounded-xl bg-rose-500/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs"><ArrowDownRight size={14} /> Spending</div>
            <div className="font-num font-bold mt-1">{fmt(spending)}</div>
          </div>
        </div>
      </div>

      <div className="wc-card p-6">
        <h3 className="font-head font-bold text-lg mb-3">Activity</h3>
        <div className="divide-y divide-white/5">
          {transactions.map((t) => (
            <button
              key={t.id}
              onClick={() => openTxn(t)}
              data-testid={`txn-${t.id}`}
              className="w-full flex items-center justify-between py-3 text-left hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 grid place-items-center text-sm font-semibold shrink-0">{t.merchant[0]}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.merchant}</div>
                  <div className="text-xs text-slate-500">{t.category} · {dateLabel(t.date)}{t.pending ? " · Pending" : ""}</div>
                </div>
              </div>
              <div className={`font-num font-semibold ${t.amount > 0 ? "text-emerald-400" : "text-slate-200"}`}>
                {t.amount > 0 ? "+" : ""}{fmtC(t.amount)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <TransactionDialog
        txn={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onUpdated={() => { load(); setSelected(null); }}
      />
    </div>
  );
}

function account_type(t) {
  return { checking: "Checking", savings: "Savings", credit: "Credit Card", investment: "Investment", loan: "Loan" }[t] || t;
}
