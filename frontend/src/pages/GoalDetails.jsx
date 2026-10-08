import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { fmt, relativeMonths } from "@/lib/format";
import { RingProgress } from "@/components/Charts";
import { Icon } from "@/lib/icons";
import { goalImage } from "@/lib/images";
import Celebration from "@/components/Celebration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export default function GoalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [g, setG] = useState(null);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [months, setMonths] = useState("");
  const [addAmt, setAddAmt] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const load = () =>
    api.get(`/goals/${id}`).then((r) => {
      setG(r.data);
      setTarget(String(r.data.target));
      setMonthly(String(r.data.monthly_contribution));
      setMonths(String(r.data.deadline ? Math.max(1, relativeMonths(r.data.deadline)) : 12));
    }).catch(() => navigate("/app/goals"));

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!g) return <div className="text-slate-500 animate-pulse">Loading goal…</div>;
  const pct = Math.round((g.current / g.target) * 100);
  const remaining = Math.max(0, g.target - g.current);
  const monthsLeft = g.monthly_contribution > 0 ? Math.ceil(remaining / g.monthly_contribution) : null;

  const saveEdits = async () => {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + parseInt(months || "12"));
    await api.patch(`/goals/${id}`, {
      target: parseFloat(target),
      monthly_contribution: parseFloat(monthly),
      deadline: deadline.toISOString(),
    });
    toast.success("Goal updated");
    setEditing(false);
    load();
  };

  const contribute = async () => {
    const amt = parseFloat(addAmt);
    if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
    const { data } = await api.post(`/goals/${id}/contribute`, { amount: amt });
    setAddAmt("");
    setG(data.goal);
    if (data.reached) setCelebrate(true);
    else toast.success(`Added ${fmt(amt)} to ${g.name}`);
  };

  const del = async () => {
    await api.delete(`/goals/${id}`);
    toast("Goal removed");
    navigate("/app/goals");
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/app/goals")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white" data-testid="back-btn">
        <ArrowLeft size={16} /> Goals
      </button>

      <div className="wc-card overflow-hidden p-0">
        <div className="relative h-40">
          <img src={goalImage(g)} alt={g.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,13,0.15) 0%, rgba(10,11,13,0.5) 55%, rgba(19,20,26,0.96) 100%)" }} />
          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl grid place-items-center backdrop-blur-md" style={{ background: `${g.color}2e`, color: "#fff", border: `1px solid ${g.color}66` }}>
              <Icon name={g.icon} size={22} />
            </div>
            <h1 className="font-head text-2xl font-extrabold drop-shadow" style={{ color: "#fff" }}>{g.name}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center text-center p-6">
          <div className="mb-5 -mt-2">
            <RingProgress value={pct} label={`${pct}%`} sub="complete" from={g.color} to="#8CFFDD" color={g.color} size={160} stroke={12} />
          </div>
          <div className="font-num text-xl font-bold">{fmt(g.current)} <span className="text-slate-500">/ {fmt(g.target)}</span></div>
          {monthsLeft != null && pct < 100 && (
            <p className="text-slate-400 text-sm mt-2">
              On track to reach your goal in about <span className="text-white font-semibold">{monthsLeft} months</span>.
            </p>
          )}
          {pct >= 100 && <p className="text-emerald-400 text-sm mt-2 font-semibold">You did it! Goal reached 🎉</p>}
        </div>
      </div>

      {/* Add money */}
      <div className="wc-card p-6">
        <h3 className="font-head font-bold mb-3">Add money</h3>
        <div className="flex gap-2">
          <Input type="number" value={addAmt} onChange={(e) => setAddAmt(e.target.value)} placeholder="Amount" data-testid="contribute-input" className="bg-white/5 border-white/12 rounded-xl" />
          <Button onClick={contribute} data-testid="contribute-btn" className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1">
            <Plus size={16} /> Add
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          {[50, 100, 250].map((a) => (
            <button key={a} onClick={() => setAddAmt(String(a))} className="text-xs px-3 py-1.5 rounded-full border border-white/12 hover:bg-white/5" data-testid={`quick-add-${a}`}>
              +{fmt(a)}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="wc-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-head font-bold">Goal settings</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-amber-400 hover:underline" data-testid="edit-goal-btn">Edit</button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-slate-300">Target ($)</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="edit-target-input" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
            </div>
            <div>
              <Label className="text-sm text-slate-300">Monthly contribution ($)</Label>
              <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} data-testid="edit-monthly-input" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
            </div>
            <div>
              <Label className="text-sm text-slate-300">Timeline (months)</Label>
              <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} data-testid="edit-months-input" className="mt-1 bg-white/5 border-white/12 rounded-xl" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={saveEdits} data-testid="save-goal-btn" className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Save</Button>
              <Button onClick={() => setEditing(false)} variant="outline" className="rounded-xl border-white/15 bg-white/5">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-px rounded-xl overflow-hidden border border-white/8">
            <Row label="Target" value={fmt(g.target)} />
            <Row label="Monthly contribution" value={fmt(g.monthly_contribution)} />
            <Row label="Remaining" value={fmt(remaining)} />
          </div>
        )}
        <button onClick={del} className="text-sm text-rose-400/80 hover:text-rose-400 mt-4" data-testid="delete-goal-btn">Delete goal</button>
      </div>

      <Celebration
        show={celebrate}
        title={`${g.name} complete!`}
        message={`You reached ${fmt(g.target)}. That's a huge milestone — I'm proud of you!`}
        onClose={() => { setCelebrate(false); load(); }}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03]">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-num font-semibold">{value}</span>
    </div>
  );
}
