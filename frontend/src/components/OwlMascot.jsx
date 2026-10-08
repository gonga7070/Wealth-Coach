import { OWL } from "@/lib/assets";
import { motion } from "framer-motion";

export function OwlAvatar({ size = 48, className = "", float = false, glow = true }) {
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${float ? "wc-float" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? "0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.25)" : "none",
      }}
      data-testid="owl-avatar"
    >
      <img src={OWL} alt="Athena the owl" className="w-full h-full object-cover" />
    </div>
  );
}

export function OwlBubble({ children, name = "Athena", className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${className}`}
      data-testid="owl-bubble"
    >
      <OwlAvatar size={44} float />
      <div className="flex-1 rounded-2xl rounded-tl-sm bg-indigo-950/50 border border-indigo-500/25 p-4">
        <div className="text-[11px] uppercase tracking-wide text-indigo-300 font-semibold mb-1">
          {name} · your coach
        </div>
        <div className="text-sm text-indigo-100 leading-relaxed">{children}</div>
      </div>
    </motion.div>
  );
}
