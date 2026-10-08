import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmt, dateLabel } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { OwlBubble } from "@/components/OwlMascot";
import { Badge } from "@/components/ui/badge";

export default function Recurring() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/recurring").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading recurring payments…</div>;

  const bills = data.items.filter((i) => !i.is_subscription).sort((a, b) => b.amount - a.amount);
  const subs = data.items.filter((i) => i.is_subscription).sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">What keeps coming out</h1>
        <p className="text-slate-400 mt-1">Bills and subscriptions, so nothing surprises you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="wc-card p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Monthly recurring</p>
          <div className="font-num text-3xl font-extrabold mt-1">{fmt(data.total_monthly)}</div>
        </div>
        <div className="wc-card p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">{data.subscription_count} subscriptions</p>
          <div className="font-num text-3xl font-extrabold mt-1 text-indigo-300">{fmt(data.subscriptions_total)}</div>
        </div>
      </div>

      <OwlBubble>
        You have {data.subscription_count} active subscriptions adding up to {fmt(data.subscriptions_total)}/month. Cancelling just one or two could quietly boost your savings.
      </OwlBubble>

      <Section title="Bills" items={bills} />
      <Section title="Subscriptions" items={subs} showReview />
    </div>
  );
}

function Section({ title, items, showReview }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">{title}</h3>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="wc-card p-5 flex items-center justify-between" data-testid={`recurring-${r.name.toLowerCase().replace(/ /g, "-")}`}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/5 grid place-items-center text-slate-300">
                <Icon name={r.icon} size={20} />
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {r.name}
                  {showReview && <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/20 text-[10px]">Review</Badge>}
                </div>
                <div className="text-xs text-slate-500">Next: {dateLabel(r.next_date)} · {r.cadence}</div>
              </div>
            </div>
            <div className="font-num font-bold">{fmt(r.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
