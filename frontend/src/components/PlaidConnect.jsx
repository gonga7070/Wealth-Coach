import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import api, { apiErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PlaidConnect({ onConnected }) {
  const [status, setStatus] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(() => {
    api.get("/plaid/status").then((r) => setStatus(r.data)).catch(() => setStatus({ enabled: false, connected: false }));
  }, []);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  const onSuccess = useCallback(async (public_token) => {
    setBusy(true);
    try {
      const { data } = await api.post("/plaid/exchange", { public_token });
      toast.success(`Connected ${data.institution} — ${data.accounts} accounts imported`);
      setLinkToken(null);
      loadStatus();
      onConnected && onConnected();
    } catch (e) {
      toast.error(apiErr(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  }, [onConnected, loadStatus]);

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess, onExit: () => setLinkToken(null) });
  useEffect(() => { if (linkToken && ready) open(); }, [linkToken, ready, open]);

  const begin = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/plaid/link-token");
      setLinkToken(data.link_token);
    } catch (e) {
      toast.error(apiErr(e.response?.data?.detail));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    await api.post("/plaid/disconnect");
    toast("Bank disconnected");
    loadStatus();
    onConnected && onConnected();
  };

  if (!status) return null;

  return (
    <div className="wc-card p-5 flex items-center gap-4" data-testid="plaid-card">
      <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 grid place-items-center shrink-0">
        <Landmark size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold flex items-center gap-2">
          {status.connected ? "Bank connected" : "Connect your bank"}
          {status.enabled && <span className="text-[10px] uppercase tracking-wide text-slate-500 border border-white/10 rounded-full px-2 py-0.5">{status.env}</span>}
        </div>
        <div className="text-sm text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          {status.enabled
            ? (status.connected ? "Your accounts sync securely via Plaid." : "Securely link via Plaid — we never see your bank login.")
            : "Live bank connect is ready — add your Plaid API keys to turn it on."}
        </div>
      </div>
      {status.enabled ? (
        status.connected ? (
          <Button variant="outline" onClick={disconnect} data-testid="plaid-disconnect-btn" className="rounded-full border-white/15 bg-white/5">
            Disconnect
          </Button>
        ) : (
          <Button onClick={begin} disabled={busy} data-testid="plaid-connect-btn" className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1.5">
            {busy ? <Loader2 className="animate-spin" size={16} /> : "Connect Bank"}
          </Button>
        )
      ) : (
        <span className="text-xs text-slate-500 border border-white/10 rounded-full px-3 py-1.5 shrink-0" data-testid="plaid-disabled">Setup needed</span>
      )}
    </div>
  );
}
