import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onClick,
  active,
  danger,
  disabled,
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`icon-btn clickable ${active ? "active" : ""} ${danger ? "danger" : ""}`}
    >
      {icon}
    </motion.button>
  );
}
