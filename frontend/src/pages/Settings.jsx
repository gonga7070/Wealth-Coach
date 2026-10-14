import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlaidLink } from "react-plaid-link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import api, { apiErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Crown, Download, Trash2, RefreshCw, LogOut, Moon, Sun, ShieldCheck, Lock,
  Building2, Link2, CheckCircle2, MailWarning, Loader2, Bell, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">{title}</h3>
      <div className="wc-card overflow-hidden">{children}</div>
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ current_password: "", new_password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setErr("");
    if (f.new_password.length < 6) return setErr("New password must be at least 6 characters.");
    if (f.new_password !== f.confirm) return setErr("New passwords don't match.");
    setSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: f.current_password, new_password: f.new_password });
      toast.success("Password updated");
      setOpen(false);
      setF({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      setErr(apiErr(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="change-password-btn" className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition">
          <Lock size={20} className="text-slate-400" />
          <div className="flex-1"><div className="font-medium">Change password</div><div className="text-xs text-slate-500">Update your account password</div></div>
        </button>
      </DialogTrigger>
      <DialogContent className="wc-glass border-white/10" data-testid="change-password-dialog">
        <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-slate-300 text-sm">Current password</Label>
            <Input type="password" data-testid="current-password-input" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} className="mt-1.5 bg-white/5 border-white/12" /></div>
          <div><Label className="text-slate-300 text-sm">New password</Label>
            <Input type="password" data-testid="new-password-input" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} className="mt-1.5 bg-white/5 border-white/12" /></div>
          <div><Label className="text-slate-300 text-sm">Confirm new password</Label>
            <Input type="password" data-testid="confirm-new-password-input" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} className="mt-1.5 bg-white/5 border-white/12" /></div>
          {err && <div data-testid="change-password-error" className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-3.5 py-2.5">{err}</div>}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} data-testid="save-password-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">{saving ? "Saving…" : "Update password"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReconnectButton({ itemId, onDone }) {
  const [token, setToken] = useState(null);
  const onSuccess = useCallback(async () => { toast.success("Bank reconnected"); setToken(null); onDone && onDone(); }, [onDone]);
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit: () => setToken(null) });
  useEffect(() => { if (token && ready) open(); }, [token, ready, open]);
  const begin = async () => {
    try {
      const { data } = await api.post("/plaid/reconnect", { item_id: itemId });
      setToken(data.link_token);
    } catch (e) { toast.error(apiErr(e.response?.data?.detail)); }
  };
  return <button onClick={begin} data-testid={`reconnect-${itemId}`} className="text-xs text-amber-400 hover:underline">Reconnect</button>;
}

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [plaidEnabled, setPlaidEnabled] = useState(false);
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [name, setName] = useState(user?.name || "");
  const [editName, setEditName] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(() => {
    api.get("/plaid/items").then((r) => { setItems(r.data.items); setPlaidEnabled(r.data.enabled); }).catch(() => {});
  }, []);
  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { if (user?.preferences) setPrefs(user.preferences); }, [user]);

  const savePrefs = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      await api.put("/profile/preferences", patch);
      await refreshUser();
      toast.success("Preferences saved");
    } catch { toast.error("Couldn't save preferences"); }
  };

  const saveName = async () => {
    try { await api.put("/profile/preferences", { name: name.trim() }); await refreshUser(); setEditName(false); toast.success("Profile updated"); }
    catch { toast.error("Couldn't update name"); }
  };

  const saveNotif = async (key, val) => {
    const notifications = { ...(prefs.notifications || {}), [key]: val };
    setPrefs({ ...prefs, notifications });
    try { await api.put("/profile/preferences", { notifications: { [key]: val } }); await refreshUser(); }
    catch { toast.error("Couldn't save"); }
  };

  const refreshBanks = async () => {
    setRefreshing(true);
    try { const { data } = await api.post("/plaid/refresh"); toast.success(`Synced — ${data.new_transactions} new transactions`); loadItems(); }
    catch (e) { toast.error(apiErr(e.response?.data?.detail)); }
    finally { setRefreshing(false); }
  };

  const disconnect = async (itemId) => {
    try { await api.post("/plaid/disconnect", { item_id: itemId }); toast("Bank disconnected"); loadItems(); }
    catch { toast.error("Couldn't disconnect"); }
  };

  const exportData = async () => {
    try {
      const { data } = await api.get("/profile/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "wealth-coach-data.json"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch { toast.error("Export failed"); }
  };

  const deleteAccount = async () => {
    try { await api.delete("/profile"); toast("Your account has been deleted"); logout(); navigate("/"); }
    catch { toast.error("Couldn't delete account"); }
  };

  const resetData = async () => {
    try {
      await api.post("/profile/reset-data");
      await refreshUser();
      toast.success("Everything's been reset to zero.");
      setTimeout(() => window.location.assign("/app"), 400);
    } catch { toast.error("Couldn't reset. Please try again."); }
  };

  const notif = prefs.notifications || {};

  return (
    <div className="space-y-5">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Settings</h1>

      {/* Profile */}
      <div className="wc-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 grid place-items-center text-2xl font-extrabold">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-head font-bold text-lg truncate">{user?.name}</div>
          <div className="text-sm text-slate-400 truncate">{user?.email}</div>
        </div>
        <Dialog open={editName} onOpenChange={setEditName}>
          <DialogTrigger asChild><Button data-testid="edit-profile-btn" variant="outline" className="rounded-full border-white/15 bg-white/5">Edit</Button></DialogTrigger>
          <DialogContent className="wc-glass border-white/10" data-testid="edit-profile-dialog">
            <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
            <div><Label className="text-slate-300 text-sm">Full name</Label>
              <Input data-testid="edit-name-input" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 bg-white/5 border-white/12" /></div>
            <p className="text-xs text-slate-500">Email ({user?.email}) can't be changed yet.</p>
            <DialogFooter><Button onClick={saveName} data-testid="save-name-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!user?.plus && (
        <button onClick={() => navigate("/app/premium")} data-testid="settings-plus-btn" className="w-full wc-card wc-card-hover p-5 flex items-center gap-4 text-left border-amber-500/30">
          <Crown size={22} className="text-amber-400" />
          <div className="flex-1"><div className="font-semibold">Upgrade to Wealth Coach Plus</div><div className="text-sm text-slate-400">Unlimited coaching & advanced insights</div></div>
        </button>
      )}

      {/* Security */}
      <Section title="Security">
        <div className="divide-y divide-white/5">
          <div className="flex items-center gap-4 px-5 py-4">
            {user?.email_verified
              ? <CheckCircle2 size={20} className="text-emerald-400" />
              : <MailWarning size={20} className="text-amber-400" />}
            <div className="flex-1">
              <div className="font-medium">Email verification</div>
              <div className="text-xs text-slate-500">{user?.email_verified ? "Your email is verified" : "Not verified yet — check the banner to resend"}</div>
            </div>
            {user?.email_verified && <span className="text-xs text-emerald-400 font-medium" data-testid="email-verified-badge">Verified</span>}
          </div>
          <ChangePasswordDialog />
        </div>
      </Section>

      {/* Bank connections */}
      <Section title="Bank connections">
        <div className="divide-y divide-white/5">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-slate-500">{plaidEnabled ? "Securely linked via Plaid" : "Plaid not configured"}</span>
            {items.length > 0 && (
              <button onClick={refreshBanks} disabled={refreshing} data-testid="refresh-banks-btn" className="text-xs text-amber-400 hover:underline inline-flex items-center gap-1.5">
                {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync now
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-5 py-5 text-sm text-slate-400 flex items-center gap-3" data-testid="no-banks">
              <Link2 size={18} className="text-slate-500" /> No banks connected. Go to <button className="text-amber-400 hover:underline" onClick={() => navigate("/app/money")}>Money</button> to connect one.
            </div>
          ) : items.map((it) => (
            <div key={it.item_id} className="flex items-center gap-4 px-5 py-4" data-testid={`bank-item-${it.item_id}`}>
              <div className="w-10 h-10 rounded-lg bg-white/5 grid place-items-center overflow-hidden shrink-0">
                {it.logo ? <img src={`data:image/png;base64,${it.logo}`} alt="" className="w-full h-full object-contain" /> : <Building2 size={18} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{it.institution}</div>
                <div className="text-xs text-slate-500">{it.accounts} account{it.accounts !== 1 ? "s" : ""}{it.last_sync ? ` · synced ${new Date(it.last_sync).toLocaleDateString()}` : ""}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <ReconnectButton itemId={it.item_id} onDone={loadItems} />
                <button onClick={() => disconnect(it.item_id)} data-testid={`disconnect-${it.item_id}`} className="text-xs text-rose-400 hover:underline">Disconnect</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Financial preferences */}
      <Section title="Financial preferences">
        <div className="divide-y divide-white/5">
          <div className="flex items-center justify-between px-5 py-4">
            <div><div className="font-medium">Country</div><div className="text-xs text-slate-500">Used for currency & tips</div></div>
            <span className="text-sm text-slate-300">{user?.country || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div><div className="font-medium">Display currency</div><div className="text-xs text-slate-500">We never blend currencies without a rate</div></div>
            <Select value={prefs.display_currency || "USD"} onValueChange={(v) => savePrefs({ display_currency: v })}>
              <SelectTrigger data-testid="currency-select" className="w-28 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="CAD">CAD (CA$)</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div><div className="font-medium">Date format</div></div>
            <Select value={prefs.date_format || "MMM D, YYYY"} onValueChange={(v) => savePrefs({ date_format: v })}>
              <SelectTrigger data-testid="dateformat-select" className="w-40 bg-white/5 border-white/12"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="MMM D, YYYY">MMM D, YYYY</SelectItem><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="divide-y divide-white/5">
          {[
            { key: "spending_alerts", label: "Spending alerts", sub: "Unusual spending in a category" },
            { key: "budget_alerts", label: "Budget alerts", sub: "When you near a budget limit" },
            { key: "savings_reminders", label: "Savings reminders", sub: "Nudges toward your goals" },
          ].map((n) => (
            <div key={n.key} className="flex items-center gap-4 px-5 py-4">
              <Bell size={18} className="text-slate-400" />
              <div className="flex-1"><div className="font-medium">{n.label}</div><div className="text-xs text-slate-500">{n.sub}</div></div>
              <Switch data-testid={`notif-${n.key}`} checked={notif[n.key] !== false} onCheckedChange={(v) => saveNotif(n.key, v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between px-5 py-4">
          <div><div className="font-medium">Theme</div><div className="text-xs text-slate-500">Choose how Wealth Coach looks</div></div>
          <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/8" data-testid="theme-toggle">
            <button onClick={() => setTheme("dark")} data-testid="theme-dark-btn" className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${theme === "dark" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}><Moon size={15} /> Dark</button>
            <button onClick={() => setTheme("light")} data-testid="theme-light-btn" className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${theme === "light" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}><Sun size={15} /> Light</button>
          </div>
        </div>
      </Section>

      {/* Privacy & data */}
      <Section title="Privacy & data">
        <div className="divide-y divide-white/5">
          <div className="px-5 py-4 text-xs text-slate-500 leading-relaxed">
            Wealth Coach stores the account balances and transactions you connect or enter, plus your goals and preferences, to show your dashboard and coaching. Bank access tokens are encrypted and never leave our server. We never sell your data.
          </div>
          <button onClick={exportData} data-testid="export-data-btn" className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition">
            <Download size={20} className="text-slate-400" /><div className="flex-1"><div className="font-medium">Export my data</div><div className="text-xs text-slate-500">Download everything as JSON</div></div>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button data-testid="reset-app-btn" className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition">
                <RotateCcw size={20} className="text-amber-400" /><div className="flex-1"><div className="font-medium">Reset financial data</div><div className="text-xs text-slate-500">Clear banks, accounts, goals & portfolio — keeps your name and settings</div></div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="wc-glass border-white/10" data-testid="reset-app-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset financial data to zero?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes all your accounts, transactions, goals, budgets, portfolio and connected banks, setting your money back to zero. Your name, email and app settings are kept, and you stay logged in. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetData} data-testid="confirm-reset-app-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Reset to zero</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button data-testid="delete-account-btn" className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition">
                <Trash2 size={20} className="text-rose-400" /><div className="flex-1"><div className="font-medium text-rose-400">Delete account</div><div className="text-xs text-slate-500">Permanently remove your account and data</div></div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="wc-glass border-white/10" data-testid="delete-account-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your profile, connected banks, accounts, transactions, goals and preferences. Any Plaid connections are removed. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} data-testid="confirm-delete-account-btn" className="rounded-full bg-rose-600 hover:bg-rose-500 text-white">Delete everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>

      <button onClick={() => { logout(); navigate("/"); }} data-testid="settings-logout-btn" className="w-full wc-card p-4 flex items-center justify-center gap-2 text-rose-400 hover:bg-white/[0.03] transition">
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}
