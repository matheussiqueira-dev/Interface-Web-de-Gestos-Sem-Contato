import type { ReactNode } from "react";
import { motion } from "framer-motion";

type StatusTone = "success" | "warning" | "danger" | "neutral";

interface StatusPillProps {
  label: string;
  value: string;
  tone: StatusTone;
  icon?: ReactNode;
}

export function StatusPill({ label, value, tone, icon }: StatusPillProps) {
  const dotClassName = `dot dot-${tone === "success" ? "active" : tone}`;

  return (
    <motion.div
      className="status-pill glass"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      aria-live="polite"
    >
      {icon ? <span className="status-icon">{icon}</span> : null}
      <span className={dotClassName} />
      <div className="status-pill-copy">
        <span className="status-pill-label">{label}</span>
        <strong>{value}</strong>
      </div>
    </motion.div>
  );
}
