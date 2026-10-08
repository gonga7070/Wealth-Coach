import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { fmt } from "@/lib/format";
import { LESSON_IMAGES, INVEST_HERO } from "@/lib/images";
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
        <button key={h.id} onClick={() => navigate(`/app/money/${h.id}`)} data-testid="investing-holding" className="w-full wc-card wc-card-hover text-left overflow-hidden p-0">
          <div className="relative h-36">
            <img src={INVEST_HERO} alt="Investments" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,13,0.25) 0%, rgba(10,11,13,0.55) 50%, rgba(19,20,26,0.96) 100%)" }} />
            <div className="absolute bottom-4 left-5">
              <p className="text-xs uppercase tracking-wide drop-shadow" style={{ color: "rgba(255,255,255,0.85)" }}>Your investments · {h.institution}</p>
              <div className="font-num text-3xl font-extrabold mt-1 drop-shadow" style={{ color: "#fff" }}>{fmt(h.balance)}</div>
              <p className="text-sm mt-0.5 drop-shadow" style={{ color: "rgba(255,255,255,0.8)" }}>{h.name} — tap to view activity</p>
            </div>
          </div>
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
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <img src={LESSON_IMAGES[l.id]} alt={l.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-xs text-slate-500">{l.summary}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-relaxed pl-13 pr-2">
                <span className="inline-block text-[10px] uppercase tracking-wide text-slate-500 mb-2">{l.level}</span>
                <p>{l.body}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
