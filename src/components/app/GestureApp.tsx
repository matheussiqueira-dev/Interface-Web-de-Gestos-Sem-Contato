"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { IntroView } from "@/components/app/IntroView";
import { GlobalErrorBoundary } from "@/components/layout/GlobalErrorBoundary";
import type { InputMode } from "@/types/input";

// The board pulls in the tracking hooks and canvas code; load it only when a
// visitor picks how to control it.
const GestureWorkspace = dynamic(() => import("@/components/gesture/GestureWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="ms-container workspace-loading" role="status">
      Abrindo o quadro…
    </div>
  ),
});

export function GestureApp() {
  const [mode, setMode] = useState<InputMode | null>(null);
  const [returned, setReturned] = useState(false);

  if (!mode) {
    return <IntroView onStart={setMode} focusHeading={returned} />;
  }

  return (
    <GlobalErrorBoundary onReset={() => setMode(null)}>
      <GestureWorkspace
        key={mode}
        mode={mode}
        onSwitchMode={setMode}
        onExit={() => {
          setReturned(true);
          setMode(null);
        }}
      />
    </GlobalErrorBoundary>
  );
}
