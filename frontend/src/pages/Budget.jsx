import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { Bar } from "@/components/Charts";
import { Icon } from "@/lib/icons";
import { OwlBubble } from "@/components/OwlMascot";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Budget() {
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [val, setVal] = useState(0);

  const load = () => api.get("/budget").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading your plan…</div>;

  const openEdit = (b) => { setEdit(b); setVal(b.limit); };
  const save = async () => {
    await api.patch("/budget", { category: edit.category, limit: val });
    toast.success(`${edit.category} plan updated`);
    setEdit(null);
    load();
  };

  const overCount = data.budget.filter((b) => b.pct > 100).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Your spending plan</h1>
        <p className="text-slate-400 mt-1">Gentle guardrails — not restrictions.</p>
      </div>

      <div className="wc-card p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Spent this month</p>
            <div className="font-num text-3xl font-extrabold mt-1">{fmt(data.total_spent)}</div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Planned</p>
            <div className="font-num text-xl font-bold text-slate-300 mt-1">{fmt(data.total_limit)}</div>
          </div>
        </div>
        <Bar className="mt-4" value={(data.total_spent / data.total_limit) * 100} color={data.total_spent > data.total_limit ? "#F43F5E" : "#10B981"} />
      </div>

      {overCount > 0 && (
        <OwlBubble>
          You've gone over on {overCount} {overCount === 1 ? "category" : "categories"} this month. No stress — tap one to adjust the plan so it fits your real life.
        </OwlBubble>
      )}

      <div className="space-y-3">
        {data.budget.map((b) => {
          const over = b.pct > 100;
          const near = b.pct >= 80 && b.pct <= 100;
          const color = over ? "#F43F5E" : near ? "#F59E0B" : b.color;
          return (
            <button
              key={b.id}
              onClick={() => openEdit(b)}
              data-testid={`budget-${b.category.toLowerCase()}`}
              className="w-full wc-card wc-card-hover p-5 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `${b.color}22`, color: b.color }}>
                    <Icon name={b.icon} size={20} />
                  </div>
                  <span className="font-semibold">{b.category}</span>
                </div>
                <span className="font-num text-sm">
                  <span className={over ? "text-rose-400 font-bold" : ""}>{fmt(b.spent)}</span>
                  <span className="text-slate-500"> / {fmt(b.limit)}</span>
                </span>
              </div>
              <Bar value={b.pct} color={color} />
              {over && <div className="text-xs text-rose-400 mt-2">Over by {fmt(b.spent - b.limit)} — tap to adjust</div>}
              {near && <div className="text-xs text-amber-400 mt-2">Getting close to your limit</div>}
            </button>
          );
        })}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="wc-glass border-white/10 max-w-sm" data-testid="budget-edit-dialog">
          {edit && (
            <div>
              <h3 className="font-head text-xl font-extrabold">{edit.category} plan</h3>
              <p className="text-sm text-slate-400 mt-1">Set a monthly amount that feels right.</p>
              <div className="font-num text-4xl font-extrabold text-center my-6" style={{ color: edit.color }}>{fmt(val)}</div>
              <Slider value={[val]} onValueChange={(v) => setVal(v[0])} min={0} max={3000} step={25} data-testid="budget-slider" />
              <div className="flex justify-between text-xs text-slate-500 mt-2"><span>$0</span><span>$3,000</span></div>
              <p className="text-xs text-slate-400 mt-4">You've spent {fmt(edit.spent)} so far this month.</p>
              <Button onClick={save} data-testid="save-budget-btn" className="w-full mt-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Save plan</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
