import { OWL } from "@/lib/assets";
import { motion } from "framer-motion";

export function OwlAvatar({ size = 48, className = "", float = false }) {
  return (
    <div
      className={`relative shrink-0 grid place-items-center ${float ? "wc-float" : ""} ${className}`}
      style={{ width: size, height: size }}
      data-testid="owl-avatar"
    >
      <img src={OWL} alt="Hoot the owl" className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
    </div>
  );
}

export function OwlBubble({ children, name = "Hoot", className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${className}`}
      data-testid="owl-bubble"
    >
      <OwlAvatar size={42} />
      <div className="flex-1 wc-card p-4">
        <div className="text-[11px] uppercase tracking-wider text-amber-500/90 font-semibold mb-1">
          {name} · your coach
        </div>
        <div className="text-sm text-slate-200 leading-relaxed">{children}</div>
      </div>
    </motion.div>
  );
}
