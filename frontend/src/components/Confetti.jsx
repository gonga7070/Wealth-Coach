import { useEffect, useState } from "react";

const COLORS = ["#F5A623", "#B39AFF", "#8CFFDD", "#FDE68A", "#FF8FB1", "#A9CBFF"];

// Lightweight one-shot confetti sprinkle. Renders for ~3.2s then unmounts itself.
export default function Confetti({ count = 44 }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 3200);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden" data-testid="confetti">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: "-6vh",
            width: 7 + Math.random() * 7,
            height: 7 + Math.random() * 7,
            background: COLORS[i % COLORS.length],
            borderRadius: i % 2 ? "50%" : "2px",
            opacity: 0.9,
            animation: `wc-confetti-fall ${2.4 + Math.random() * 1.6}s cubic-bezier(.2,.6,.3,1) ${Math.random() * 0.5}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
