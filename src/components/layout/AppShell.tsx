"use client";

import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-container">
      <div className="app-background" aria-hidden="true" />
      {children}
    </div>
  );
}
