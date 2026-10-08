import { AnimatePresence, motion } from "framer-motion";
import { OWL_CELEBRATE } from "@/lib/assets";
import { Button } from "@/components/ui/button";

const COLORS = ["#F59E0B", "#6366F1", "#10B981", "#FDE68A", "#F43F5E"];

export default function Celebration({ show, title, message, onClose }) {
  const pieces = Array.from({ length: 60 });
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 wc-glass"
          data-testid="celebration-overlay"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {pieces.map((_, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${Math.random() * 100}%`,
                  top: "-5vh",
                  width: 8 + Math.random() * 6,
                  height: 8 + Math.random() * 6,
                  background: COLORS[i % COLORS.length],
                  borderRadius: i % 2 ? "50%" : "2px",
                  animation: `wc-confetti-fall ${2.5 + Math.random() * 2}s linear ${Math.random()}s forwards`,
                }}
              />
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative wc-card max-w-sm w-full text-center p-8"
          >
            <motion.div
              initial={{ rotate: -6, scale: 0.9 }}
              animate={{ rotate: [-6, 6, -6], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="w-40 h-44 mx-auto mb-5 flex items-end justify-center"
            >
              <img src={OWL_CELEBRATE} alt="Celebration owl" className="h-full w-auto object-contain drop-shadow-[0_10px_30px_rgba(245,158,11,0.3)]" />
            </motion.div>
            <h2 className="text-2xl font-head font-extrabold mb-2 wc-gold-text">{title}</h2>
            <p className="text-slate-300 text-sm mb-6">{message}</p>
            <Button
              onClick={onClose}
              data-testid="celebration-close-btn"
              className="w-full rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
            >
              Keep it up
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
