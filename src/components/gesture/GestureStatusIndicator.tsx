"use client";

import { Camera, Cloud, Cpu, Hand } from "lucide-react";
import type { ReactNode } from "react";

import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";

interface GestureStatusIndicatorProps {
  cameraReady: boolean;
  cameraError: string | null;
  trackingStatus: "idle" | "loading" | "ready" | "error";
  handDetected: boolean;
  saveBadge: string;
  persistenceMode: "api" | "local";
}

interface StatusItem {
  label: string;
  value: string;
  tone: StatusTone;
  icon: ReactNode;
}

export function GestureStatusIndicator({
  cameraReady,
  cameraError,
  trackingStatus,
  handDetected,
  saveBadge,
  persistenceMode,
}: GestureStatusIndicatorProps) {
  const items: StatusItem[] = [
    {
      label: "Camera",
      value: cameraError ? "Erro" : cameraReady ? "Ativa" : "Aguardando",
      tone: cameraError ? "danger" : cameraReady ? "success" : "warning",
      icon: <Camera size={14} />,
    },
    {
      label: "Modelo",
      value:
        trackingStatus === "ready"
          ? "Pronto"
          : trackingStatus === "loading"
            ? "Carregando"
            : trackingStatus === "error"
              ? "Erro"
              : "Idle",
      tone:
        trackingStatus === "ready"
          ? "success"
          : trackingStatus === "loading"
            ? "warning"
            : trackingStatus === "error"
              ? "danger"
              : "neutral",
      icon: <Cpu size={14} />,
    },
    {
      label: "Mao",
      value: handDetected ? "Detectada" : "Buscando",
      tone: handDetected ? "success" : "neutral",
      icon: <Hand size={14} />,
    },
    {
      label: "Persistencia",
      value: saveBadge,
      tone: persistenceMode === "api" ? "success" : "warning",
      icon: <Cloud size={14} />,
    },
  ];

  return (
    <div className="status-deck">
      {items.map((item) => (
        <StatusPill key={item.label} label={item.label} value={item.value} tone={item.tone} icon={item.icon} />
      ))}
    </div>
  );
}
