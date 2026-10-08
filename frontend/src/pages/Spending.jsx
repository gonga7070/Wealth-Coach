import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Spending() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/spending").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading spending…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Where your money goes</h1>
        <p className="text-slate-400 mt-1">This month, organized for you.</p>
      </div>

      <div className="wc-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categories}
                dataKey="amount"
                innerRadius={58}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {data.categories.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase text-slate-500">Spent</span>
            <span className="font-num text-2xl font-extrabold">{fmt(data.total)}</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
          {data.categories.map((c) => (
            <div key={c.category} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-slate-300 flex-1 truncate">{c.category}</span>
              <span className="font-num text-slate-400">{fmt(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.categories.map((c) => {
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
                  {fmt(Math.abs(c.difference), { sign: false })} {over ? "higher" : "lower"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
