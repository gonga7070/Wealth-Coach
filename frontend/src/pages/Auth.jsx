import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { OWL } from "@/lib/assets";
import { useAuth } from "@/context/AuthContext";
import { apiErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Apple } from "lucide-react";
import { toast } from "sonner";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await register(name, email, password);
      navigate(user.onboarded ? "/app" : "/onboarding");
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wc-app-bg min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button onClick={() => navigate("/")} className="flex items-center gap-3 mb-8 mx-auto">
          <div className="w-14 h-14 grid place-items-center">
            <img src={OWL} alt="owl" className="w-full h-full object-contain drop-shadow" />
          </div>
        </button>
        <div className="wc-card p-7">
          <h1 className="font-head text-2xl font-extrabold text-center">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-center text-sm text-slate-400 mt-1 mb-6">
            {isLogin ? "Log in to your coach." : "Let's get your money explained."}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast("Social login is demo-only — use email to continue")}
              data-testid="google-btn"
              className="h-11 rounded-xl border-white/12 bg-white/5 hover:bg-white/10 gap-2"
            >
              <Mail size={16} /> Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast("Social login is demo-only — use email to continue")}
              data-testid="apple-btn"
              className="h-11 rounded-xl border-white/12 bg-white/5 hover:bg-white/10 gap-2"
            >
              <Apple size={16} /> Apple
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-5 text-xs text-slate-500">
            <div className="flex-1 h-px bg-white/10" /> or with email <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-slate-300 text-sm">Full name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="name-input"
                  placeholder="Alex Morgan"
                  className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
                />
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
                placeholder="you@example.com"
                className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                data-testid="password-input"
                placeholder="••••••••"
                className="mt-1.5 h-11 bg-white/5 border-white/12 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-btn"
              className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
            >
              {loading ? "Please wait…" : isLogin ? "Log In" : "Get Started"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link
              to={isLogin ? "/register" : "/login"}
              data-testid="auth-switch-link"
              className="text-amber-400 font-semibold hover:underline"
            >
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
