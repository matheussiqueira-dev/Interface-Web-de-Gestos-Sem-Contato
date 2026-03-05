"use client";

import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true">
        <div className="app-background-orb app-background-orb-left" />
        <div className="app-background-orb app-background-orb-right" />
        <div className="app-background-grid" />
        <div className="app-background-perspective" />
        <div className="app-background-scanline" />
      </div>
      <div className="app-shell-content">{children}</div>
    </div>
  );
}
