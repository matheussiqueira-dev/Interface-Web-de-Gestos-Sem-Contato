"use client";

import type { PerformanceSnapshot } from "@/core/system/performance";

interface SystemHealthOverlayProps {
  performance: PerformanceSnapshot;
  trackingEnabled: boolean;
  notes: number;
}

export function SystemHealthOverlay({ performance, trackingEnabled, notes }: SystemHealthOverlayProps) {
  return (
    <aside className="system-health glass" aria-live="polite">
      <h2>System Health</h2>
      <ul>
        <li>
          <span>Tracking</span>
          <strong>{trackingEnabled ? "Ativo" : "Pausado"}</strong>
        </li>
        <li>
          <span>FPS</span>
          <strong>{performance.fps.toFixed(1)}</strong>
        </li>
        <li>
          <span>Frame (ms)</span>
          <strong>{performance.frameTimeMs.toFixed(2)}</strong>
        </li>
        <li>
          <span>Memoria</span>
          <strong>{performance.memoryMb ? `${performance.memoryMb.toFixed(1)} MB` : "N/D"}</strong>
        </li>
        <li>
          <span>Notas</span>
          <strong>{notes}</strong>
        </li>
      </ul>
    </aside>
  );
}
