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
              initial={{ rotate: -8 }}
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-5 ring-2 ring-amber-400/40"
            >
              <img src={OWL_CELEBRATE} alt="Celebration owl" className="w-full h-full object-cover" />
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
