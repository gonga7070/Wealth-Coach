import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { RingProgress, Bar } from "@/components/Charts";
import { OwlBubble } from "@/components/OwlMascot";

export default function Savings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/savings").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading savings…</div>;
  const ef = data.emergency_fund;
  const efPct = ef ? Math.round((ef.current / ef.target) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Your safety net</h1>
        <p className="text-slate-400 mt-1">Building security, one month at a time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wc-card p-6 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total savings</p>
          <div className="font-num text-4xl font-extrabold mt-1">{fmt(data.total_savings)}</div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase text-slate-500">Monthly</div>
              <div className="font-num font-bold mt-1">{fmt(data.monthly_contribution)}</div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase text-slate-500">Recommended target</div>
              <div className="font-num font-bold mt-1">{fmt(data.recommended_target)}/mo</div>
            </div>
          </div>
        </div>
        <div className="wc-card p-6 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Savings rate</p>
          <RingProgress value={data.savings_rate} label={`${data.savings_rate}%`} sub="of income" color="#F59E0B" size={130} />
        </div>
      </div>

      <OwlBubble>
        You're saving <span className="text-amber-300 font-semibold">{data.savings_rate}%</span> of your income
        {data.savings_rate >= 20 ? " — that's excellent, well above the 20% benchmark!" : ". Nudging toward 20% would build your cushion even faster."}
      </OwlBubble>

      {ef && (
        <button onClick={() => navigate(`/app/goals/${ef.id}`)} data-testid="savings-emergency-card" className="w-full wc-card wc-card-hover p-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-head font-bold text-lg">Emergency Fund</h3>
            <span className="font-num font-bold text-emerald-400">{efPct}%</span>
          </div>
          <div className="font-num text-sm text-slate-400 mb-3">{fmt(ef.current)} / {fmt(ef.target)}</div>
          <Bar value={efPct} color="#10B981" />
          <p className="text-xs text-slate-500 mt-3">Your emergency fund is {efPct}% complete.</p>
        </button>
      )}
    </div>
  );
}
