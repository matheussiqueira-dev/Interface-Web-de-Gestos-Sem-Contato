"use client";

import { useEffect, useRef } from "react";

interface DrawingCanvasProps {
  width: number;
  height: number;
  x: number;
  y: number;
  /** True while a pinch (or press) on free space should leave a stroke. */
  drawing: boolean;
  color: string;
  clearSignal: number;
}

/**
 * Freehand strokes under the notes. Strokes are not part of the saved
 * workspace: they live in the canvas until cleared or the page closes.
 */
export function DrawingCanvas({ width, height, x, y, drawing, color, clearSignal }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || width === 0 || height === 0) {
      return;
    }

    // Resizing a canvas clears it; strokes do not survive a board resize.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 4;
    lastPointRef.current = null;
  }, [height, width]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    context?.clearRect(0, 0, width, height);
    lastPointRef.current = null;
  }, [clearSignal, height, width]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !drawing) {
      lastPointRef.current = null;
      return;
    }

    const last = lastPointRef.current;
    if (last) {
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(last.x, last.y);
      context.lineTo(x, y);
      context.stroke();
    }
    lastPointRef.current = { x, y };
  }, [color, drawing, x, y]);

  return (
    <canvas
      ref={canvasRef}
      className="board__canvas"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
