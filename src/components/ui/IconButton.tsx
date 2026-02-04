import React from 'react';
import { motion } from 'framer-motion';

interface IconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    active,
    danger,
    title
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`icon-btn clickable ${active ? 'active' : ''} ${danger ? 'danger' : ''}`}
            title={title}
        >
            {icon}
        </motion.button>
    );
};
