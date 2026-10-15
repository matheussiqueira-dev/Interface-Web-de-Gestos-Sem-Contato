"use client";

import type { PerformanceSnapshot } from "@/core/system/performance";
import type { SessionMetrics } from "@/hooks/useSessionMetrics";
import type { InputMode } from "@/types/input";

interface SessionPanelProps {
  mode: InputMode;
  metrics: SessionMetrics;
  performance: PerformanceSnapshot;
  notes: number;
}

const integer = new Intl.NumberFormat("pt-BR");
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function SessionPanel({ mode, metrics, performance, notes }: SessionPanelProps) {
  const pinchLabel = mode === "pointer" ? "Cliques ou toques" : "Pinças";
  const presenceLabel = mode === "pointer" ? "Cursor no quadro" : "Mão presente";

  const rows: Array<[string, string]> = [
    ["Tempo de sessão", formatDuration(metrics.elapsedSeconds)],
    [pinchLabel, integer.format(metrics.pinchCount)],
    ...(mode === "pointer" ? [] : [["Punhos", integer.format(metrics.fistCount)] as [string, string]]),
    [presenceLabel, percent.format(metrics.handPresence / 100)],
    ["Interações por segundo", decimal.format(metrics.interactionRate)],
    ["Notas", integer.format(notes)],
  ];

  return (
    <div className="side-panel__body">
      <dl className="metric-list">
        {rows.map(([label, value]) => (
          <div key={label} className="metric-list__row">
            <dt>{label}</dt>
            <dd className="ms-num">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="side-panel__subhead">Desempenho da página</h3>
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>Quadros por segundo</dt>
          <dd className="ms-num">{performance.fps > 0 ? decimal.format(performance.fps) : "—"}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Tempo por quadro</dt>
          <dd className="ms-num">
            {performance.frameTimeMs > 0 ? `${decimal.format(performance.frameTimeMs)} ms` : "—"}
          </dd>
        </div>
      </dl>
      <p className="field__help">
        Medido nesta sessão, no seu navegador.
        {mode === "demo" ? " Na demonstração, a mão é simulada." : ""}
      </p>
    </div>
  );
}
