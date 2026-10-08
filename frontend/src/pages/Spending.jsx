import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip,
} from "recharts";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const RANGES = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "all", label: "All" },
];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="wc-card px-3 py-2 text-xs">
      <div className="text-slate-400">{label}</div>
      <div className="font-num font-bold text-amber-400">{fmt(payload[0].value)}</div>
    </div>
  );
}

export default function Spending() {
  const navigate = useNavigate();
  const [range, setRange] = useState("this_month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/spending?range=${range}`).then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  const curMonth = new Date().toLocaleDateString("en-US", { month: "short" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Where your money goes</h1>
        <p className="text-slate-400 mt-1">{data?.range_label || "This month"}, organized for you.</p>
      </div>

      {/* Range selector */}
      <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/8" data-testid="range-selector">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            data-testid={`range-${r.key}`}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-sm font-medium transition ${
              range === r.key ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Monthly trend */}
      <div className="wc-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-head font-bold">Spending over time</h3>
          <span className="text-xs text-slate-500">Last 6 months</span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.trend || []} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<TrendTooltip />} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {(data?.trend || []).map((d, i) => (
                  <Cell key={i} fill={d.month === curMonth ? "#F5A623" : "#3a3d46"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="wc-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.categories || []} dataKey="amount" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none">
                {(data?.categories || []).map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase text-slate-500">Spent</span>
            <span className="font-num text-2xl font-extrabold">{fmt(data?.total || 0)}</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
          {(data?.categories || []).map((c) => (
            <div key={c.category} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-slate-300 flex-1 truncate">{c.category}</span>
              <span className="font-num text-slate-400">{fmt(c.amount)}</span>
            </div>
          ))}
          {!loading && (data?.categories || []).length === 0 && (
            <div className="col-span-2 text-sm text-slate-500">No spending in this period.</div>
          )}
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {(data?.categories || []).map((c) => {
          const over = c.difference > 0;
          return (
            <button
              key={c.category}
              onClick={() => navigate("/app/budget")}
              data-testid={`spending-cat-${c.category.toLowerCase()}`}
              className="w-full wc-card wc-card-hover p-5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: `${c.color}22`, color: c.color }}>
                  <Icon name={c.icon} size={22} />
                </div>
                <div>
                  <div className="font-semibold">{c.category}</div>
                  <div className="text-xs text-slate-500">Usually {fmt(c.usual)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-num font-bold">{fmt(c.amount)}</div>
                <div className={`text-xs flex items-center gap-0.5 justify-end ${over ? "text-rose-400" : "text-emerald-400"}`}>
                  {over ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {fmt(Math.abs(c.difference))} {over ? "higher" : "lower"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
