import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { fmt, relativeMonths } from "@/lib/format";
import { Bar, RingProgress } from "@/components/Charts";
import { Icon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";

const GOAL_TYPES = [
  { type: "emergency", icon: "Shield", label: "Emergency", color: "#6FA38B" },
  { type: "travel", icon: "Plane", label: "Vacation", color: "#E0A458" },
  { type: "car", icon: "Car", label: "New Car", color: "#6E8CA0" },
  { type: "home", icon: "Home", label: "Home", color: "#9A8BB0" },
  { type: "invest", icon: "TrendingUp", label: "Investing", color: "#7FA68A" },
  { type: "custom", icon: "Target", label: "Custom", color: "#C96F6F" },
];

const TYPE_COLOR = Object.fromEntries(GOAL_TYPES.map((t) => [t.type, t.color]));
const colorOf = (g) => TYPE_COLOR[g.type] || g.color || "#E0A458";

export default function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.get("/goals").then((r) => setGoals(r.data.goals)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!goals) return <div className="text-slate-500 animate-pulse">Loading goals…</div>;

  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget ? Math.round((totalCurrent / totalTarget) * 100) : 0;
  const completed = goals.filter((g) => g.current >= g.target).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-extrabold">What you're working toward</h1>
          <p className="text-slate-400 mt-1">Every goal, with a clear path to get there.</p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          data-testid="new-goal-btn"
          className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1.5 shrink-0"
        >
          <Plus size={18} /> <span className="hidden sm:inline">New goal</span>
        </Button>
      </div>

      {/* Summary */}
      <div className="wc-card p-6 flex flex-col sm:flex-row items-center gap-6" data-testid="goals-summary">
        <RingProgress value={overallPct} label={`${overallPct}%`} sub="funded" from="#FDE68A" to="#F5A623" size={104} stroke={9} />
        <div className="flex-1 grid grid-cols-3 gap-4 w-full">
          <SummaryStat label="Saved across goals" value={fmt(totalCurrent)} accent />
          <SummaryStat label="Total targets" value={fmt(totalTarget)} />
          <SummaryStat label="Active goals" value={`${goals.length}${completed ? ` · ${completed} done` : ""}`} />
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="wc-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 grid place-items-center mx-auto mb-4 text-amber-400">
            <Target size={26} />
          </div>
          <h3 className="font-head font-bold text-lg">No goals yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-5">Set your first goal and I'll map out how to reach it.</p>
          <Button onClick={() => setCreating(true)} className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Create a goal</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const months = g.deadline ? Math.max(0, relativeMonths(g.deadline)) : null;
            const remaining = Math.max(0, g.target - g.current);
            const color = colorOf(g);
            const done = pct >= 100;
            return (
              <motion.button
                key={g.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/app/goals/${g.id}`)}
                data-testid={`goal-card-${g.id}`}
                className="wc-card wc-card-hover p-6 text-left relative overflow-hidden"
              >
                <span className="absolute left-0 top-0 h-full w-1" style={{ background: color }} />
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${color}1f`, color }}>
                      <Icon name={g.icon} size={24} />
                    </div>
                    <div>
                      <div className="font-head font-bold text-lg leading-tight">{g.name}</div>
                      <div className="font-num text-sm text-slate-400 mt-0.5">
                        {fmt(g.current)} <span className="text-slate-600">/ {fmt(g.target)}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={done ? { background: "#6FA38B22", color: "#8FC1A9" } : { background: `${color}1f`, color }}
                  >
                    {done ? "Complete" : `${pct}%`}
                  </span>
                </div>

                <Bar value={pct} color={color} glow />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <Meta label="Remaining" value={fmt(remaining)} />
                  <Meta label="Per month" value={fmt(g.monthly_contribution)} />
                  <Meta
                    label="Timeline"
                    value={done ? "Reached" : months != null ? `~${months} mo` : "—"}
                    right
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <CreateGoalModal open={creating} onClose={() => setCreating(false)} onCreated={() => { load(); setCreating(false); }} />
    </div>
  );
}

function SummaryStat({ label, value, accent }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`font-num font-bold mt-1 text-base sm:text-lg ${accent ? "text-amber-400" : ""}`}>{value}</div>
    </div>
  );
}

function Meta({ label, value, right }) {
  return (
    <div className={right ? "text-right" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-num text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function CreateGoalModal({ open, onClose, onCreated }) {
  const [sel, setSel] = useState(GOAL_TYPES[0]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [months, setMonths] = useState("12");
  const [saving, setSaving] = useState(false);

  const monthly = target && months ? (parseFloat(target) - (parseFloat(current) || 0)) / parseFloat(months) : 0;

  const create = async () => {
    if (!name || !target) { toast.error("Add a name and target amount"); return; }
    setSaving(true);
    try {
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + parseInt(months || "12"));
      await api.post("/goals", {
        name, type: sel.type, icon: sel.icon, color: sel.color,
        target: parseFloat(target), current: parseFloat(current) || 0,
        monthly_contribution: Math.max(0, Math.round(monthly)),
        deadline: deadline.toISOString(),
      });
      toast.success("Goal created!");
      setName(""); setTarget(""); setCurrent(""); setMonths("12");
      onCreated();
    } catch {
      toast.error("Couldn't create goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="wc-glass border-white/10 max-w-md max-h-[90vh] overflow-y-auto" data-testid="create-goal-dialog">
        <DialogTitle className="sr-only">Create a goal</DialogTitle>
        <h3 className="font-head text-xl font-extrabold">Create a goal</h3>
        <p className="text-sm text-slate-400 -mt-1">Pick a type and we'll do the math.</p>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {GOAL_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setSel(t)}
              data-testid={`goaltype-${t.type}`}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${
                sel.type === t.type ? "border-amber-500/60 bg-amber-500/10" : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span style={{ color: t.color }}><Icon name={t.icon} size={20} /></span>
              <span className="text-[11px]">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 mt-3">
          <div>
            <Label className="text-sm text-slate-300">Goal name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="goal-name-input" placeholder="e.g. Japan trip" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-slate-300">Target ($)</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="goal-target-input" placeholder="5000" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
            </div>
            <div>
              <Label className="text-sm text-slate-300">Saved so far ($)</Label>
              <Input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} data-testid="goal-current-input" placeholder="0" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="text-sm text-slate-300">Timeline (months)</Label>
            <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} data-testid="goal-months-input" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
          </div>
        </div>

        {monthly > 0 && (
          <div className="mt-4 wc-card p-4 text-sm text-slate-300" data-testid="goal-calc">
            You'll need about <span className="font-num font-bold text-amber-400">{fmt(Math.round(monthly))}/month</span> to reach this goal on time.
          </div>
        )}

        <Button onClick={create} disabled={saving} data-testid="create-goal-submit" className="w-full mt-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">
          {saving ? "Creating…" : "Create goal"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
