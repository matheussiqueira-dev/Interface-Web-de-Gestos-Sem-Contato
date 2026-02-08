import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface CursorProps {
  x: number;
  y: number;
  isPinching: boolean;
  handDetected: boolean;
  color: string;
}

export function Cursor({ x, y, isPinching, handDetected, color }: CursorProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {handDetected && (
        <motion.div
          className="cursor-wrapper"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: x - 15,
            y: y - 15,
          }}
          exit={{ opacity: 0, scale: 0.2 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  type: "spring",
                  stiffness: 550,
                  damping: 34,
                  mass: 0.45,
                  x: { duration: 0.05 },
                  y: { duration: 0.05 },
                }
          }
        >
          <motion.div
            className="cursor-ring"
            animate={{
              scale: isPinching ? 0.84 : 1,
              borderColor: isPinching ? color : "rgba(255,255,255,0.75)",
              borderWidth: isPinching ? 4 : 2,
              boxShadow: isPinching
                ? `0 0 18px ${color}`
                : "0 0 10px rgba(15,23,42,0.32)",
            }}
          />

          <motion.div
            className="cursor-dot"
            animate={{
              scale: isPinching ? 1.15 : 0,
              backgroundColor: color,
            }}
          />

          {!prefersReducedMotion && isPinching && (
            <motion.div
              className="cursor-pulse"
              style={{ borderColor: color }}
              initial={{ scale: 1, opacity: 0.35 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.95 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
