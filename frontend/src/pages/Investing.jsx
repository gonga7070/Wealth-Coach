import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { OwlBubble } from "@/components/OwlMascot";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { GraduationCap } from "lucide-react";

export default function Investing() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/investing").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500 animate-pulse">Loading investing academy…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-head text-2xl sm:text-3xl font-extrabold">Investing, made simple</h1>
        <p className="text-slate-400 mt-1">Understand how to grow your wealth — no jargon.</p>
      </div>

      {data.holdings.map((h) => (
        <button key={h.id} onClick={() => navigate(`/app/money/${h.id}`)} data-testid="investing-holding" className="w-full wc-card wc-card-hover p-6 text-left">
          <p className="text-xs uppercase tracking-wide text-slate-400">Your investments · {h.institution}</p>
          <div className="font-num text-3xl font-extrabold mt-1">{fmt(h.balance)}</div>
          <p className="text-sm text-slate-500 mt-1">{h.name} — tap to view activity</p>
        </button>
      ))}

      <OwlBubble>
        Investing isn't about picking winners — it's about time and consistency. Start with the basics below, and remember: the goal is to understand, not to feel overwhelmed.
      </OwlBubble>

      <div className="wc-card p-2 sm:p-4">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-amber-300 font-semibold">
          <GraduationCap size={18} /> Learn the essentials
        </div>
        <Accordion type="single" collapsible className="px-1">
          {data.lessons.map((l) => (
            <AccordionItem key={l.id} value={l.id} className="border-white/8" data-testid={`lesson-${l.id}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-300 grid place-items-center shrink-0">
                    <Icon name={l.icon} size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-xs text-slate-500">{l.summary}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-relaxed pl-13 pr-2">
                <span className="inline-block text-[10px] uppercase tracking-wide text-indigo-400 mb-2">{l.level}</span>
                <p>{l.body}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
