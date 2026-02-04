import React from 'react';
import { motion } from 'framer-motion';

interface StatusPillProps {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, value, tone }) => {
  const dotClass = `dot dot-${tone === 'success' ? 'active' : tone === 'neutral' ? 'inactive' : tone}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass status-pill"
    >
      <div className={dotClass} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span>{value}</span>
      </div>
    </motion.div>
  );
};
