import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorProps {
    x: number;
    y: number;
    isPinching: boolean;
    handDetected: boolean;
    color: string;
}

export const Cursor: React.FC<CursorProps> = ({ x, y, isPinching, handDetected, color }) => {
    return (
        <AnimatePresence>
            {handDetected && (
                <motion.div
                    className="cursor-wrapper"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: x - 15, // center 30px
                        y: y - 15,
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 28,
                        mass: 0.5,
                        x: { duration: 0.05 },
                        y: { duration: 0.05 }
                    }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 30,
                        height: 30,
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                >
                    {/* Outer Ring */}
                    <motion.div
                        animate={{
                            scale: isPinching ? 0.8 : 1,
                            borderColor: isPinching ? color : 'rgba(255, 255, 255, 0.8)',
                            borderWidth: isPinching ? 4 : 2,
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            borderStyle: 'solid',
                            boxShadow: isPinching ? `0 0 15px ${color}` : '0 0 10px rgba(0,0,0,0.3)',
                        }}
                    />

                    {/* Inner Dot */}
                    <motion.div
                        animate={{
                            scale: isPinching ? 1.2 : 0,
                            backgroundColor: color,
                        }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            marginLeft: -4,
                            marginTop: -4,
                        }}
                    />

                    {/* Pulse Effect */}
                    {isPinching && (
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                border: `2px solid ${color}`,
                            }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
