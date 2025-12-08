// src/components/CanvasOverlay.tsx
import { useEffect, useRef } from "react";

interface Props {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
    drawingEnabled: boolean;
    color: string;
}

export function CanvasOverlay({ cursorX, cursorY, isPinching, drawingEnabled, color }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    // Resize canvas
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        cvs.width = window.innerWidth;
        cvs.height = window.innerHeight;
    }, []);

    // Drawing Logic
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        if (isPinching && drawingEnabled) {
            if (lastPos.current) {
                // Draw line
                ctx.beginPath();
                ctx.moveTo(lastPos.current.x, lastPos.current.y);
                ctx.lineTo(cursorX, cursorY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
            lastPos.current = { x: cursorX, y: cursorY };
        } else {
            // Lift pen
            lastPos.current = null;
        }

    }, [cursorX, cursorY, isPinching, drawingEnabled, color]);

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
            {/* Drawing Layer */}
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0 }}
            />

            {/* Cursor */}
            <div
                style={{
                    position: "absolute",
                    transform: `translate(${cursorX}px, ${cursorY}px)`,
                    left: -12, // Center cursor (24px width)
                    top: -12,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `2px solid ${isPinching ? color : 'white'}`,
                    backgroundColor: isPinching ? 'rgba(255,255,255,0.3)' : 'transparent',
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    transition: "transform 0.05s linear",
                    zIndex: 100, // Always on top
                }}
            />
        </div>
    );
}
