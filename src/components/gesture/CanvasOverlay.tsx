"use client";

import { useEffect, useRef } from "react";

import { Cursor } from "@/components/ui/Cursor";

interface CanvasOverlayProps {
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
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 5;
    context.globalCompositeOperation = "source-over";

    contextRef.current = context;
  }, [dpr, height, width]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    lastPositionRef.current = null;
  }, [clearSignal, height, width]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) {
      return;
    }

    if (!handDetected || !drawingEnabled || !isPinching) {
      lastPositionRef.current = null;
      return;
    }

    if (lastPositionRef.current) {
      context.shadowBlur = 11;
      context.shadowColor = color;
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(lastPositionRef.current.x, lastPositionRef.current.y);
      context.lineTo(cursorX, cursorY);
      context.stroke();
      context.shadowBlur = 0;
    }

    lastPositionRef.current = { x: cursorX, y: cursorY };
  }, [color, cursorX, cursorY, drawingEnabled, handDetected, isPinching]);

  return (
    <div className="canvas-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="drawing-canvas" />
      <Cursor x={cursorX} y={cursorY} isPinching={isPinching} handDetected={handDetected} color={color} />
    </div>
  );
}
