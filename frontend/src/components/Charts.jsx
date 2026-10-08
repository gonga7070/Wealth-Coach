export function RingProgress({ value = 0, size = 120, stroke = 10, color = "#F59E0B", label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="wc-ring">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-num text-2xl font-extrabold">{label}</span>
        {sub && <span className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export function Bar({ value = 0, color = "#F59E0B", className = "" }) {
  return (
    <div className={`h-2 rounded-full bg-white/8 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, value)}%`, background: color, transition: "width 1s ease" }}
      />
    </div>
  );
}
