"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

interface ParticleSystemProps {
  x: number;
  y: number;
  isPinching: boolean;
  color: string;
  width: number;
  height: number;
  enabled: boolean;
}

export function ParticleSystem({
  x,
  y,
  isPinching,
  color,
  width,
  height,
  enabled,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cursorRef = useRef({ x, y, isPinching, color });
  const sizeRef = useRef({ width, height });

  useEffect(() => {
    cursorRef.current = { x, y, isPinching, color };
  }, [color, isPinching, x, y]);

  useEffect(() => {
    sizeRef.current = { width, height };
  }, [height, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frameId = 0;

    const render = () => {
      const current = sizeRef.current;
      context.clearRect(0, 0, current.width, current.height);

      if (enabled && cursorRef.current.isPinching) {
        for (let index = 0; index < 2; index += 1) {
          particlesRef.current.push({
            x: cursorRef.current.x,
            y: cursorRef.current.y,
            vx: (Math.random() - 0.5) * 2.1,
            vy: (Math.random() - 0.5) * 2.1,
            life: 1,
            size: Math.random() * 2.7 + 0.9,
            color: cursorRef.current.color,
          });
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0).slice(-220);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.028;
        particle.size *= 0.994;

        context.globalAlpha = Math.max(0, particle.life);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
      });

      context.globalAlpha = 1;
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} width={width} height={height} className="particle-layer" aria-hidden="true" />;
}
