import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api, { apiErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(apiErr(err.response?.data?.detail) || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wc-app-bg min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="block mb-8 mx-auto text-center">
          <span className="font-head font-extrabold text-xl">Wealth Coach</span>
        </button>
        <div className="wc-card p-7">
          {sent ? (
            <div className="text-center" data-testid="forgot-sent">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center mx-auto mb-4">
                <MailCheck size={24} />
              </div>
              <h1 className="font-head text-2xl font-extrabold">Check your inbox</h1>
              <p className="text-sm text-slate-400 mt-2">
                If an account exists for <span className="text-slate-200">{email}</span>, we've sent a link to reset your password. It expires in 1 hour.
              </p>
              <Link to="/login" data-testid="back-to-login-link" className="inline-flex items-center gap-1.5 text-amber-400 font-semibold text-sm mt-6 hover:underline">
                <ArrowLeft size={15} /> Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-head text-2xl font-extrabold text-center">Forgot your password?</h1>
              <p className="text-center text-sm text-slate-400 mt-1 mb-6">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email-input"
                    placeholder="you@example.com"
                    className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
                  />
                </div>
                {error && (
                  <div data-testid="forgot-error" className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-3.5 py-2.5">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit-btn"
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
              <p className="text-center text-sm text-slate-400 mt-5">
                <Link to="/login" data-testid="forgot-back-link" className="text-amber-400 font-semibold hover:underline">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
