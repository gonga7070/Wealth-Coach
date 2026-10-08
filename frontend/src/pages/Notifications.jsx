import { useEffect, useState } from "react";
import api from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

const STYLE = {
  positive: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  alert: "bg-rose-500/15 text-rose-300",
};

export default function Notifications() {
  const [data, setData] = useState(null);

  const load = () => api.get("/notifications").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading alerts…</div>;

  const markAll = async () => { await api.post("/notifications/read"); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Alerts & tips</h1>
          <p className="text-slate-400 mt-1">Only the stuff that's actually useful.</p>
        </div>
        {data.unread > 0 && (
          <Button onClick={markAll} variant="outline" data-testid="mark-read-btn" className="rounded-full border-white/15 bg-white/5 gap-1.5 text-sm">
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {data.notifications.map((n) => (
          <div
            key={n.id}
            data-testid="notification-item"
            className={`wc-card p-5 flex items-start gap-4 ${!n.read ? "border-amber-500/25" : ""}`}
          >
            <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${STYLE[n.type] || STYLE.positive}`}>
              <Icon name={n.icon} size={20} />
            </div>
            <div className="flex-1">
              <div className="font-semibold flex items-center gap-2">
                {n.title}
                {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400" />}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{n.body}</p>
              <div className="text-xs text-slate-600 mt-1.5">{dateLabel(n.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
