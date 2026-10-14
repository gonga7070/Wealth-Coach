import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { apiErr } from "@/lib/api";
import { fmtCur, dateLabel } from "@/lib/format";
import TransactionDialog from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const CATS = ["Housing", "Food", "Restaurants", "Shopping", "Transportation", "Entertainment", "Bills", "Health"];

function toDateInput(iso) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

function ManualTxnDialog({ open, onOpenChange, accountId, currency, txn, onSaved }) {
  const editing = !!txn;
  const [f, setF] = useState({ merchant: "", kind: "expense", amount: "", category: "Shopping", date: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (txn) {
        setF({
          merchant: txn.merchant || "",
          kind: txn.amount > 0 ? "income" : "expense",
          amount: String(Math.abs(txn.amount || 0)),
          category: txn.amount > 0 ? "Shopping" : (CATS.includes(txn.category) ? txn.category : "Shopping"),
          date: toDateInput(txn.date),
          note: txn.note || "",
        });
      } else {
        setF({ merchant: "", kind: "expense", amount: "", category: "Shopping", date: new Date().toISOString().slice(0, 10), note: "" });
      }
    }
  }, [open, txn]);

  const save = async () => {
    if (!f.merchant.trim()) return toast.error("Add a description.");
    const amt = parseFloat(f.amount || "0") || 0;
    if (amt <= 0) return toast.error("Enter an amount greater than 0.");
    const signed = f.kind === "income" ? Math.abs(amt) : -Math.abs(amt);
    const category = f.kind === "income" ? "Income" : f.category;
    const dateISO = f.date ? new Date(f.date + "T00:00:00").toISOString() : undefined;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/transactions/${txn.id}`, { merchant: f.merchant.trim(), amount: signed, category, date: dateISO, note: f.note });
        toast.success("Transaction updated");
      } else {
        await api.post("/transactions", { account_id: accountId, merchant: f.merchant.trim(), amount: signed, category, date: dateISO, note: f.note });
        toast.success("Transaction added");
      }
      onSaved();
    } catch (e) {
      toast.error(apiErr(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this transaction?")) return;
    try { await api.delete(`/transactions/${txn.id}`); toast.success("Transaction deleted"); onSaved(); }
    catch (e) { toast.error(apiErr(e.response?.data?.detail)); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wc-glass border-white/10" data-testid="manual-txn-dialog">
        <DialogHeader><DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">Description</Label>
            <Input data-testid="txn-merchant-input" value={f.merchant} onChange={(e) => setF({ ...f, merchant: e.target.value })} placeholder="e.g. Grocery store" className="mt-1.5 bg-white/5 border-white/12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Type</Label>
              <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                <SelectTrigger data-testid="txn-kind-select" className="mt-1.5 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Amount ({currency})</Label>
              <Input data-testid="txn-amount-input" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0.00" className="mt-1.5 bg-white/5 border-white/12" />
            </div>
          </div>
          {f.kind === "expense" && (
            <div>
              <Label className="text-slate-300 text-sm">Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger data-testid="txn-category-select" className="mt-1.5 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-slate-300 text-sm">Date</Label>
            <Input data-testid="txn-date-input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="mt-1.5 bg-white/5 border-white/12" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm">Note (optional)</Label>
            <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="mt-1.5 bg-white/5 border-white/12" />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {editing ? (
            <Button variant="ghost" onClick={remove} data-testid="delete-txn-btn" className="text-rose-400 hover:text-rose-300 gap-1.5"><Trash2 size={16} /> Delete</Button>
          ) : <span />}
          <Button onClick={save} disabled={saving} data-testid="save-txn-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">{saving ? "Saving…" : editing ? "Save changes" : "Add transaction"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [manualDialog, setManualDialog] = useState({ open: false, txn: null });

  const load = () => api.get(`/accounts/${id}`).then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading account…</div>;
  const { account: a, transactions, income, spending } = data;
  const isManual = a.source === "manual";
  const cur = a.currency || "USD";

  const openTxn = (t) => {
    if (isManual) setManualDialog({ open: true, txn: t });
    else setSelected({ ...t, account_name: a.name });
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/app/money")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white" data-testid="back-btn">
        <ArrowLeft size={16} /> Accounts
      </button>

      <div className="wc-card p-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {account_type(a.type)} · {a.institution}{isManual ? " · Manual" : ""}
        </p>
        <h1 className="font-head text-xl font-bold mt-1">{a.name}</h1>
        <div className={`font-num text-4xl font-extrabold mt-2 ${a.balance < 0 ? "text-rose-400" : ""}`}>{fmtCur(a.balance, cur)}</div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs"><ArrowUpRight size={14} /> Income</div>
            <div className="font-num font-bold mt-1">{fmtCur(income, cur)}</div>
          </div>
          <div className="rounded-xl bg-rose-500/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs"><ArrowDownRight size={14} /> Spending</div>
            <div className="font-num font-bold mt-1">{fmtCur(spending, cur)}</div>
          </div>
        </div>
      </div>

      <div className="wc-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-head font-bold text-lg">Activity</h3>
          {isManual && (
            <Button onClick={() => setManualDialog({ open: true, txn: null })} data-testid="add-transaction-btn" variant="outline" className="rounded-full border-white/15 bg-white/5 gap-1.5">
              <Plus size={16} /> Add transaction
            </Button>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400" data-testid="txn-empty-state">
            {isManual ? "No transactions yet. Add your first one above." : "No transactions for this account yet."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((t) => (
              <button
                key={t.id}
                onClick={() => openTxn(t)}
                data-testid={`txn-${t.id}`}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/5 grid place-items-center text-sm font-semibold shrink-0">{t.merchant[0]}</div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.merchant}</div>
                    <div className="text-xs text-slate-500">{t.category} · {dateLabel(t.date)}{t.pending ? " · Pending" : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-num font-semibold ${t.amount > 0 ? "text-emerald-400" : "text-slate-200"}`}>
                    {t.amount > 0 ? "+" : ""}{fmtCur(t.amount, cur, { decimals: 2 })}
                  </span>
                  {isManual && <Pencil size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TransactionDialog
        txn={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onUpdated={() => { load(); setSelected(null); }}
      />

      <ManualTxnDialog
        open={manualDialog.open}
        onOpenChange={(o) => setManualDialog({ open: o, txn: o ? manualDialog.txn : null })}
        accountId={id}
        currency={cur}
        txn={manualDialog.txn}
        onSaved={() => { load(); setManualDialog({ open: false, txn: null }); }}
      />
    </div>
  );
}

function account_type(t) {
  return { checking: "Checking", savings: "Savings", credit: "Credit Card", investment: "Investment", loan: "Loan" }[t] || t;
}
