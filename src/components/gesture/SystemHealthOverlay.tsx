"use client";

import { Cpu } from "lucide-react";

import { Panel } from "@/components/ui/Panel";
import type { PerformanceSnapshot } from "@/core/system/performance";

interface SystemHealthOverlayProps {
  performance: PerformanceSnapshot;
  trackingEnabled: boolean;
  notes: number;
}

export function SystemHealthOverlay({ performance, trackingEnabled, notes }: SystemHealthOverlayProps) {
  return (
    <Panel
      as="aside"
      className="system-health"
      eyebrow="ENCOM DIAGNOSTICS"
      title={
        <>
          <Cpu size={16} />
          System health
        </>
      }
    >
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
    </Panel>
  );
}
