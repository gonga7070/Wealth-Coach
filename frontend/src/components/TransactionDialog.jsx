import { useState } from "react";
import api from "@/lib/api";
import { fmtC, dateLabel } from "@/lib/format";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const CATEGORIES = [
  "Housing", "Food", "Restaurants", "Shopping", "Transportation",
  "Entertainment", "Bills", "Health", "Income",
];

export default function TransactionDialog({ txn, open, onOpenChange, onUpdated }) {
  const [cat, setCat] = useState(txn?.category);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!txn) return null;

  const save = async (newCat) => {
    setSaving(true);
    try {
      await api.patch(`/transactions/${txn.id}/category`, { category: newCat });
      setCat(newCat);
      setEditing(false);
      onUpdated && onUpdated(newCat);
      toast.success(`Recategorized as ${newCat}`);
    } catch {
      toast.error("Couldn't update category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wc-glass border-white/10 max-w-sm" data-testid="transaction-dialog">
        <div className="text-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-white/5 grid place-items-center text-2xl font-bold mx-auto mb-3">
            {txn.merchant[0]}
          </div>
          <h3 className="font-head text-xl font-extrabold">{txn.merchant}</h3>
          <div className={`font-num text-3xl font-extrabold mt-1 ${txn.amount > 0 ? "text-emerald-400" : "text-white"}`}>
            {txn.amount > 0 ? "+" : ""}{fmtC(txn.amount)}
          </div>
        </div>

        <div className="mt-4 space-y-px rounded-xl overflow-hidden border border-white/8">
          <Row label="Category" value={cat} />
          <Row label="Date" value={dateLabel(txn.date)} />
          <Row label="Account" value={txn.account_name || "Account"} />
          <Row label="Status" value={txn.pending ? "Pending" : "Posted"} />
        </div>

        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            data-testid="change-category-btn"
            variant="outline"
            className="w-full mt-4 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
          >
            Change category
          </Button>
        ) : (
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2">Pick a new category — your spending updates instantly.</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  disabled={saving}
                  onClick={() => save(c)}
                  data-testid={`cat-option-${c.toLowerCase()}`}
                  className={`text-xs py-2 rounded-lg border transition ${
                    c === cat ? "bg-amber-500 text-slate-950 border-amber-500" : "border-white/12 hover:bg-white/5"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03]">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
