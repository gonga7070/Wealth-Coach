import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { apiErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmtCur } from "@/lib/format";
import PlaidConnect from "@/components/PlaidConnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Wallet, PiggyBank, CreditCard, LineChart, Landmark, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";

const TYPE_META = {
  checking: { icon: Wallet, color: "#10B981", label: "Checking" },
  savings: { icon: PiggyBank, color: "#F59E0B", label: "Savings" },
  credit: { icon: CreditCard, color: "#F43F5E", label: "Credit Card" },
  investment: { icon: LineChart, color: "#6366F1", label: "Investment" },
  loan: { icon: Landmark, color: "#A855F7", label: "Loan" },
};

function AddAccountDialog({ onAdded, defaultCurrency = "USD" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "checking", institution: "", balance: "", currency: defaultCurrency });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Give the account a name.");
    setSaving(true);
    try {
      await api.post("/accounts", {
        name: form.name.trim(), type: form.type, institution: form.institution.trim(),
        balance: parseFloat(form.balance || "0") || 0, currency: form.currency,
      });
      toast.success("Account added");
      setOpen(false);
      setForm({ name: "", type: "checking", institution: "", balance: "", currency: defaultCurrency });
      onAdded && onAdded();
    } catch (e) {
      toast.error(apiErr(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="add-account-btn" variant="outline" className="rounded-full border-white/15 bg-white/5 gap-1.5">
          <Plus size={16} /> Add account
        </Button>
      </DialogTrigger>
      <DialogContent className="wc-glass border-white/10" data-testid="add-account-dialog">
        <DialogHeader><DialogTitle>Add a manual account</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">Account name</Label>
            <Input data-testid="account-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cash wallet" className="mt-1.5 bg-white/5 border-white/12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="account-type-select" className="mt-1.5 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger data-testid="account-currency-select" className="mt-1.5 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-sm">Institution (optional)</Label>
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. My Bank" className="mt-1.5 bg-white/5 border-white/12" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm">Current balance</Label>
            <Input data-testid="account-balance-input" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" className="mt-1.5 bg-white/5 border-white/12" />
            <p className="text-xs text-slate-500 mt-1">Use a negative value for credit cards or loans you owe.</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} data-testid="save-account-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">
            {saving ? "Saving…" : "Add account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Money() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dc = user?.preferences?.display_currency || "USD";
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/accounts").then((r) => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading accounts…</div>;

  const groups = {};
  data.accounts.forEach((a) => {
    (groups[a.type] = groups[a.type] || []).push(a);
  });
  const currencies = Object.keys(data.by_currency || {});
  const isEmpty = data.accounts.length === 0;
  const lastUpdated = data.last_updated ? new Date(data.last_updated).toLocaleString() : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Your money</h1>
          <p className="text-slate-400 mt-1">Everything you own and owe, in one place.</p>
        </div>
        {!isEmpty && <AddAccountDialog onAdded={load} defaultCurrency={dc} />}
      </div>

      <PlaidConnect onConnected={load} />

      {isEmpty ? (
        <div className="wc-card p-8 text-center" data-testid="money-empty-state">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 grid place-items-center mx-auto mb-4">
            <WalletCards size={28} />
          </div>
          <h3 className="font-head text-xl font-bold">No accounts yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Connect a bank above to securely import your real balances and transactions, or add an account manually to get started.
          </p>
          <div className="mt-5 flex items-center justify-center">
            <AddAccountDialog onAdded={load} defaultCurrency={dc} />
          </div>
        </div>
      ) : (
        <>
          <div className="wc-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total net worth</p>
              {lastUpdated && <p className="text-xs text-slate-500" data-testid="accounts-last-updated">Updated {lastUpdated}</p>}
            </div>
            {currencies.length > 1 ? (
              <div className="mt-2 space-y-1" data-testid="net-worth-by-currency">
                {currencies.map((cur) => (
                  <div key={cur} className="flex items-baseline gap-2">
                    <span className="font-num text-2xl font-extrabold">{fmtCur(data.by_currency[cur], cur)}</span>
                    <span className="text-xs text-slate-500">{cur}</span>
                  </div>
                ))}
                <p className="text-xs text-slate-500 pt-1">Shown separately — we don't blend currencies without a conversion rate.</p>
              </div>
            ) : (
              <div className="font-num text-4xl font-extrabold mt-1">{fmtCur(data.net_worth, currencies[0] || "USD")}</div>
            )}
          </div>

          {Object.entries(TYPE_META).map(([type, meta]) =>
            groups[type] ? (
              <div key={type}>
                <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">{meta.label}</h3>
                <div className="space-y-3">
                  {groups[type].map((a) => (
                    <motion.button
                      key={a.id}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/app/money/${a.id}`)}
                      data-testid={`account-${a.id}`}
                      className="w-full wc-card wc-card-hover p-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl grid place-items-center overflow-hidden" style={{ background: `${meta.color}22`, color: meta.color }}>
                          {a.institution_logo ? (
                            <img src={`data:image/png;base64,${a.institution_logo}`} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <meta.icon size={22} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {a.name}
                            {a.source === "manual" && <span className="text-[10px] uppercase tracking-wide bg-white/10 text-slate-300 rounded-full px-2 py-0.5">Manual</span>}
                          </div>
                          <div className="text-xs text-slate-500">{a.institution} ·••{a.mask} · {a.currency || "USD"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-num font-bold ${a.balance < 0 ? "text-rose-400" : ""}`}>{fmtCur(a.balance, a.currency || "USD")}</span>
                        <ChevronRight size={18} className="text-slate-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </>
      )}
    </div>
  );
}
