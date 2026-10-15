import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useElementSize } from "@/hooks/useElementSize";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useSessionMetrics } from "@/hooks/useSessionMetrics";

describe("frame-driven hooks", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useSessionMetrics", () => {
    const base = { handDetected: true, isPinching: false, isFist: false, trackingEnabled: true };

    it("counts pinch and fist starts, presence and elapsed seconds", () => {
      const { result, rerender } = renderHook((props: typeof base) => useSessionMetrics(props), {
        initialProps: base,
      });

      rerender({ ...base, isPinching: true });
      rerender({ ...base, isPinching: true });
      rerender({ ...base, isPinching: false });
      rerender({ ...base, isFist: true });

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(result.current).toMatchObject({ elapsedSeconds: 1, pinchCount: 1, fistCount: 1, handPresence: 100 });
      expect(result.current.interactionRate).toBe(2);
    });

    it("does not tick while tracking is off", () => {
      const { result } = renderHook(() => useSessionMetrics({ ...base, trackingEnabled: false }));
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.elapsedSeconds).toBe(0);
    });
  });

  describe("usePerformanceMonitor", () => {
    it("reports frames per second once a second has been sampled", () => {
      const { result } = renderHook(() => usePerformanceMonitor(true));
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(result.current.fps).toBeGreaterThan(30);
      expect(result.current.frameTimeMs).toBeGreaterThan(0);
    });

    it("returns to the initial snapshot when disabled", () => {
      const { result, rerender } = renderHook(({ on }: { on: boolean }) => usePerformanceMonitor(on), {
        initialProps: { on: true },
      });
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      rerender({ on: false });
      expect(result.current).toEqual({ fps: 0, frameTimeMs: 0, memoryMb: null });
    });
  });
});

describe("useElementSize", () => {
  let observed: ResizeObserverCallback | null = null;
  const disconnect = vi.fn();

  beforeEach(() => {
    observed = null;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          observed = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function resize(width: number, height: number) {
    act(() => {
      observed?.([{ contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver);
    });
  }

  it("reports the rounded content size and ignores sub-pixel noise", () => {
    const element = document.createElement("div");
    const { result, unmount } = renderHook(() => useElementSize({ current: element }));
    expect(result.current).toEqual({ width: 0, height: 0 });

    resize(640.4, 360.6);
    const first = result.current;
    expect(first).toEqual({ width: 640, height: 361 });

    resize(640.2, 360.9);
    expect(result.current).toBe(first);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("does nothing without an element", () => {
    const { result } = renderHook(() => useElementSize({ current: null }));
    expect(result.current).toEqual({ width: 0, height: 0 });
    expect(observed).toBeNull();
  });
});
