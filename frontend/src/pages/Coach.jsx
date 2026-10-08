import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { OwlAvatar } from "@/components/OwlMascot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const SUGGESTIONS = [
  "Can I afford a $700 vacation?",
  "Why did I spend so much this month?",
  "How can I save $500 more this month?",
  "Am I spending too much on restaurants?",
];

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    api.get("/coach/history")
      .then((r) => setMessages(r.data.messages))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post("/coach/chat", { message: msg });
      setMessages((p) => [...p, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "I hit a snag thinking that through. Try me again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
      <div className="flex items-center gap-3 mb-4">
        <OwlAvatar size={48} float />
        <div>
          <h1 className="font-head text-xl font-extrabold">Ask Hoot</h1>
          <p className="text-sm text-slate-400">Your personal money coach</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {booting ? (
          <div className="text-slate-500 animate-pulse">Loading your conversation…</div>
        ) : messages.length === 0 ? (
          <div className="wc-card p-6">
            <p className="text-slate-300">
              Hi! I know your accounts, spending and goals. Ask me anything about your money and I'll explain it in plain language.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  data-testid="coach-suggestion"
                  className="text-xs px-3 py-2 rounded-full border border-white/12 hover:border-amber-500/40 hover:bg-amber-500/5 transition text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} m={m} />)
        )}
        {loading && (
          <div className="flex items-center gap-3">
            <OwlAvatar size={36} />
            <div className="wc-card px-4 py-3 flex gap-1.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 pt-3 wc-chat-fade">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your money…"
            data-testid="coach-input"
            className="h-12 bg-white/5 border-white/12 rounded-full px-5"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            data-testid="coach-send-btn"
            className="h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 p-0"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ m }) {
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser && <OwlAvatar size={36} />}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
          isUser
            ? "bg-amber-500 text-slate-950 rounded-tr-sm font-medium"
            : "wc-bubble rounded-tl-sm"
        }`}
        data-testid={isUser ? "coach-user-msg" : "coach-ai-msg"}
      >
        {m.content}
      </div>
    </motion.div>
  );
}
