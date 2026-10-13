import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api, { apiErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset! Please log in with your new password.");
      navigate("/login");
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
          <h1 className="font-head text-2xl font-extrabold text-center">Choose a new password</h1>
          <p className="text-center text-sm text-slate-400 mt-1 mb-6">
            Pick something you'll remember this time.
          </p>
          {!token ? (
            <div data-testid="reset-no-token" className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-3.5 py-2.5 text-center">
              This reset link is missing its token. Please request a new one.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">New password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="reset-password-input"
                  placeholder="••••••••"
                  className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Confirm new password</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  data-testid="reset-confirm-input"
                  placeholder="••••••••"
                  className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
                />
              </div>
              {error && (
                <div data-testid="reset-error" className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-3.5 py-2.5">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                data-testid="reset-submit-btn"
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              >
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-slate-400 mt-5">
            <Link to="/login" data-testid="reset-back-link" className="text-amber-400 font-semibold hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
