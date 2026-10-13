import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api, { apiErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then((r) => {
        setStatus("ok");
        setMessage(r.data.message || "Your email is verified.");
        if (user) refreshUser().catch(() => {});
      })
      .catch((e) => {
        setStatus("error");
        setMessage(apiErr(e.response?.data?.detail) || "Verification failed.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="wc-app-bg min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="wc-card p-8 text-center" data-testid="verify-email-page">
          {status === "loading" && (
            <>
              <Loader2 size={40} className="animate-spin text-amber-400 mx-auto mb-4" />
              <h1 className="font-head text-2xl font-extrabold">Verifying your email…</h1>
            </>
          )}
          {status === "ok" && (
            <>
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <h1 className="font-head text-2xl font-extrabold">Email verified</h1>
              <p className="text-sm text-slate-400 mt-2">{message}</p>
              <Link to={user ? "/app" : "/login"} data-testid="verify-continue-link" className="inline-block mt-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5 text-sm">
                {user ? "Go to dashboard" : "Log in"}
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle size={48} className="text-rose-400 mx-auto mb-4" />
              <h1 className="font-head text-2xl font-extrabold">Verification failed</h1>
              <p className="text-sm text-slate-400 mt-2">{message}</p>
              <Link to={user ? "/app" : "/login"} data-testid="verify-back-link" className="inline-block mt-6 text-amber-400 font-semibold text-sm hover:underline">
                {user ? "Back to app" : "Back to log in"}
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
