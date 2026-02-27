"use client";

import { useEffect, useState } from "react";

import { createPerformanceSampler, type PerformanceSnapshot } from "@/core/system/performance";

const INITIAL: PerformanceSnapshot = {
  fps: 0,
  frameTimeMs: 0,
  memoryMb: null,
};

export function usePerformanceMonitor(enabled: boolean): PerformanceSnapshot {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(INITIAL);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(INITIAL);
      return;
    }

    const sampler = createPerformanceSampler();
    let frameId = 0;

    const step = (now: number) => {
      const nextSnapshot = sampler.sample(now);
      setSnapshot(nextSnapshot);
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  return snapshot;
}
