// src/components/CanvasOverlay.tsx
import { useEffect, useRef } from "react";

interface Props {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
    drawingEnabled: boolean;
    color: string;
    width: number;
    height: number;
    dpr: number;
    clearSignal: number;
    handDetected: boolean;
}

export function CanvasOverlay({
    cursorX,
    cursorY,
    isPinching,
    drawingEnabled,
    color,
    width,
    height,
    dpr,
    clearSignal,
    handDetected,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Resize canvas
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext("2d");
        if (!ctx) return;

        cvs.width = Math.floor(width * dpr);
        cvs.height = Math.floor(height * dpr);
        cvs.style.width = `${width}px`;
        cvs.style.height = `${height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        contextRef.current = ctx;
    }, [width, height, dpr]);

    useEffect(() => {
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        lastPos.current = null;
    }, [clearSignal, width, height]);

    // Drawing Logic
    useEffect(() => {
        const ctx = contextRef.current;
        if (!ctx) return;

        if (!handDetected) {
            lastPos.current = null;
            return;
        }

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

    }, [cursorX, cursorY, isPinching, drawingEnabled, color, handDetected]);

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
                    transform: `translate3d(${cursorX}px, ${cursorY}px, 0)`,
                    left: -12, // Center cursor (24px width)
                    top: -12,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `2px solid ${isPinching ? color : 'white'}`,
                    backgroundColor: isPinching ? 'rgba(255,255,255,0.3)' : 'transparent',
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    transition: "transform 0.05s linear",
                    opacity: handDetected ? 1 : 0,
                    zIndex: 100, // Always on top
                }}
            />
        </div>
    );
}
