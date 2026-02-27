export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  memoryMb: number | null;
}

export function createPerformanceSampler() {
  let frames = 0;
  let windowStart = performance.now();
  let lastFrame = performance.now();
  let snapshot: PerformanceSnapshot = {
    fps: 0,
    frameTimeMs: 0,
    memoryMb: null,
  };

  function sample(now: number): PerformanceSnapshot {
    frames += 1;

    const windowMs = now - windowStart;
    const frameTimeMs = now - lastFrame;
    lastFrame = now;

    if (windowMs >= 1000) {
      snapshot = {
        fps: (frames * 1000) / windowMs,
        frameTimeMs,
        memoryMb: readMemoryUsage(),
      };
      frames = 0;
      windowStart = now;
    }

    return snapshot;
  }

  return {
    sample,
    getSnapshot: () => snapshot,
  };
}

export function measureDuration(label: string, action: () => void): number {
  const start = performance.now();
  action();
  const elapsed = performance.now() - start;
  if (elapsed > 16) {
    console.warn(`[perf] ${label} took ${elapsed.toFixed(2)}ms`);
  }
  return elapsed;
}

function readMemoryUsage(): number | null {
  const performanceWithMemory = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
    };
  };

  if (!performanceWithMemory.memory) {
    return null;
  }

  return performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024;
}
