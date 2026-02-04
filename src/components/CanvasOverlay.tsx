import { useEffect, useRef } from "react";
import { Cursor } from "./ui/Cursor";

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
        ctx.lineJoin = "round";
        ctx.lineWidth = 6; // Thicker lines
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

        if (!handDetected || !drawingEnabled) {
            lastPos.current = null;
            return;
        }

        if (isPinching) {
            if (lastPos.current) {
                // Glow effect for the line
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;

                ctx.beginPath();
                ctx.moveTo(lastPos.current.x, lastPos.current.y);
                ctx.lineTo(cursorX, cursorY);
                ctx.strokeStyle = color;
                ctx.stroke();

                // Clear shadow for next frame or other drawings
                ctx.shadowBlur = 0;
            }
            lastPos.current = { x: cursorX, y: cursorY };
        } else {
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

            {/* Premium Cursor */}
            <Cursor
                x={cursorX}
                y={cursorY}
                isPinching={isPinching}
                handDetected={handDetected}
                color={color}
            />
        </div>
    );
}
