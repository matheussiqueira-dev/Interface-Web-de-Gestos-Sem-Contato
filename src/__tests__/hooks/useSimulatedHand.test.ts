import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSimulatedHand } from "@/hooks/useSimulatedHand";
import { createDemoScene } from "@/lib/demo/simulatedHand";

const board = { width: 800, height: 500 };

describe("useSimulatedHand", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams 21 simulated landmarks and resets the scene every loop", () => {
    const onCycle = vi.fn();
    const { result } = renderHook(() => useSimulatedHand(true, board, onCycle));

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toHaveLength(21);
    expect(onCycle).toHaveBeenCalledTimes(1);
    expect(onCycle.mock.calls[0][0].notes).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(createDemoScene(board).durationMs);
    });
    expect(onCycle).toHaveBeenCalledTimes(2);
  });

  it("stays idle while disabled or before the board has a size", () => {
    const onCycle = vi.fn();
    const disabled = renderHook(() => useSimulatedHand(false, board, onCycle));
    const unsized = renderHook(() => useSimulatedHand(true, { width: 0, height: 0 }, onCycle));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(disabled.result.current).toBeNull();
    expect(unsized.result.current).toBeNull();
    expect(onCycle).not.toHaveBeenCalled();
  });

  it("stops and clears the landmarks when disabled", () => {
    const { result, rerender } = renderHook(({ on }: { on: boolean }) => useSimulatedHand(on, board, vi.fn()), {
      initialProps: { on: true },
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ on: false });
    expect(result.current).toBeNull();
  });
});
