import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { OwlBubble } from "@/components/OwlMascot";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const TYPE_STYLE = {
  alert: { ring: "border-rose-500/30", chip: "bg-rose-500/15 text-rose-300", bar: "#F43F5E" },
  positive: { ring: "border-emerald-500/30", chip: "bg-emerald-500/15 text-emerald-300", bar: "#10B981" },
  info: { ring: "border-indigo-500/30", chip: "bg-indigo-500/15 text-indigo-300", bar: "#6366F1" },
};

export default function Insights() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/insights").then((r) => setItems(r.data.insights)).catch(() => {});
  }, []);

  if (!items) return <div className="text-slate-500 animate-pulse">Thinking about your money…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">What matters right now</h1>
        <p className="text-slate-400 mt-1">I look through your money and surface what's important.</p>
      </div>

      <OwlBubble>
        I found {items.length} things worth knowing this month. Tap any card and I'll explain what happened and what you can do.
      </OwlBubble>

      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        className="space-y-3"
      >
        {items.map((ins) => {
          const st = TYPE_STYLE[ins.type] || TYPE_STYLE.info;
          return (
            <motion.button
              key={ins.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              onClick={() => setActive(ins)}
              data-testid={`insight-${ins.id}`}
              className={`w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left border ${st.ring}`}
            >
              <div className={`w-11 h-11 rounded-xl grid place-items-center ${st.chip}`}>
                <Icon name={ins.icon} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{ins.title}</div>
                <div className="text-sm text-slate-400 line-clamp-2">{ins.summary}</div>
              </div>
              <ChevronRight size={18} className="text-slate-600 shrink-0" />
            </motion.button>
          );
        })}
      </motion.div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="wc-glass border-white/10 max-w-md" data-testid="insight-dialog">
          {active && <InsightDetail ins={active} navigate={navigate} close={() => setActive(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InsightDetail({ ins, navigate, close }) {
  const st = TYPE_STYLE[ins.type] || TYPE_STYLE.info;
  const handleAction = (a) => {
    close();
    if (/budget|plan|trim/i.test(a)) navigate("/app/budget");
    else if (/transaction/i.test(a)) navigate("/app/money");
    else if (/subscription/i.test(a)) navigate("/app/recurring");
    else if (/goal/i.test(a)) navigate("/app/goals");
  };
  return (
    <div>
      <div className={`w-12 h-12 rounded-xl grid place-items-center ${st.chip} mb-4`}>
        <Icon name={ins.icon} size={24} />
      </div>
      <h3 className="font-head text-xl font-extrabold">{ins.title}</h3>
      <p className="text-slate-300 text-sm mt-2">{ins.summary}</p>

      {ins.this_month != null && (
        <div className="mt-5 space-y-2 rounded-xl border border-white/8 overflow-hidden">
          <Row label={ins.difference != null ? "This month" : "Amount"} value={fmt(ins.this_month)} />
          {ins.usual != null && <Row label="Usual / target" value={fmt(ins.usual)} />}
          {ins.difference != null && (
            <Row label="Difference" value={fmt(ins.difference, { sign: true })} highlight={ins.difference > 0 ? "text-rose-400" : "text-emerald-400"} />
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {ins.actions.map((a) => (
          <Button
            key={a}
            onClick={() => handleAction(a)}
            data-testid={`insight-action-${a.toLowerCase().replace(/ /g, "-")}`}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
          >
            {a}
          </Button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03]">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-num font-semibold ${highlight || ""}`}>{value}</span>
    </div>
  );
}
