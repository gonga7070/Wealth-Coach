import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { MailWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.email_verified) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/send-verification");
      setSent(true);
      toast.success("Verification email sent — check your inbox.");
    } catch {
      toast.error("Couldn't send verification email. Try again shortly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      data-testid="verify-email-banner"
      className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <MailWarning size={18} className="text-amber-400 shrink-0" />
      <p className="text-sm text-amber-100/90 flex-1">
        Please verify your email to secure your account. We sent a link to{" "}
        <span className="font-semibold">{user.email}</span>.
      </p>
      <button
        onClick={resend}
        disabled={sending || sent}
        data-testid="resend-verification-btn"
        className="text-sm font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-60 inline-flex items-center gap-1.5 shrink-0"
      >
        {sending && <Loader2 size={14} className="animate-spin" />}
        {sent ? "Email sent" : "Resend email"}
      </button>
    </div>
  );
}
