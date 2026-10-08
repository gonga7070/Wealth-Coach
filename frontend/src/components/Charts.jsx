import { useId } from "react";

// Opal-style iridescent gradient presets
export const GRADIENTS = {
  mint: ["#8CFFDD", "#34D399"],
  iris: ["#A9CBFF", "#B39AFF"],
  violet: ["#B39AFF", "#8CFFDD"],
  gold: ["#FDE68A", "#F5A623"],
  rose: ["#FFC2D1", "#F43F5E"],
};

export function RingProgress({
  value = 0, size = 120, stroke = 10, color = "#F5A623",
  from, to, label, sub, glow = true,
}) {
  const uid = useId().replace(/[:]/g, "");
  const useGrad = from && to;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const strokeVal = useGrad ? `url(#rg-${uid})` : color;
  const glowColor = (to || color) + "55";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="wc-ring">
        {useGrad && (
          <defs>
            <linearGradient id={`rg-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeVal}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)",
            filter: glow ? `drop-shadow(0 0 6px ${glowColor})` : "none",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-num text-2xl font-extrabold">{label}</span>
        {sub && <span className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export function Bar({ value = 0, color = "#F5A623", from, to, className = "", glow = false }) {
  const base = from && to ? `linear-gradient(90deg, ${from}, ${to})` : color;
  const glowColor = (to || color) + "66";
  return (
    <div className={`h-2.5 rounded-full bg-white/[0.06] overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full relative"
        style={{
          width: `${Math.min(100, value)}%`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%), ${base}`,
          boxShadow: glow ? `0 0 10px ${glowColor}` : "none",
          transition: "width 1s cubic-bezier(.2,.8,.2,1)",
        }}
      />
    </div>
  );
}
