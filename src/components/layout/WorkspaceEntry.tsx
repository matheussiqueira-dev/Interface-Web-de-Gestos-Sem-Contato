"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { GlobalErrorBoundary } from "@/components/layout/GlobalErrorBoundary";

const GestureWorkspace = dynamic(() => import("@/components/gesture/GestureWorkspace"), {
  ssr: false,
  loading: () => <div className="screen-loading">Carregando modulo de gestos ENCOM...</div>,
});

export function WorkspaceEntry() {
  return (
    <AppShell>
      <GlobalErrorBoundary>
        <Suspense fallback={<div className="screen-loading">Preparando interface ENCOM...</div>}>
          <GestureWorkspace />
        </Suspense>
      </GlobalErrorBoundary>
    </AppShell>
  );
}
