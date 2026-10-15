import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGestureEngine } from "@/hooks/useGestureEngine";
import { buildHandLandmarks } from "@/lib/demo/simulatedHand";
import type { HandLandmark } from "@/types/tracking";

const OPTIONS = { pinchSensitivity: 1, cursorResponsiveness: 1 };

function render(landmarks: HandLandmark[] | null, width = 800, height = 500) {
  return renderHook(
    ({ points, w, h }: { points: HandLandmark[] | null; w: number; h: number }) =>
      useGestureEngine(points, w, h, OPTIONS),
    { initialProps: { points: landmarks, w: width, h: height } },
  );
}

describe("useGestureEngine", () => {
  it("starts centred with no hand", () => {
    const { result } = render(null);
    expect(result.current).toMatchObject({ cursorX: 400, cursorY: 250, handDetected: false, pinchProgress: 0 });
  });

  it("detects an open hand and then a pinch", () => {
    const { result, rerender } = render(null);

    rerender({ points: buildHandLandmarks({ x: 0.5, y: 0.3 }, 0), w: 800, h: 500 });
    expect(result.current).toMatchObject({ handDetected: true, isPinching: false });
    expect(result.current.pinchProgress).toBeLessThan(1);

    rerender({ points: buildHandLandmarks({ x: 0.5, y: 0.3 }, 1), w: 800, h: 500 });
    expect(result.current).toMatchObject({ isPinching: true, pinchProgress: 1 });
  });

  it("clears the hand state when landmarks disappear", () => {
    const { result, rerender } = render(buildHandLandmarks({ x: 0.5, y: 0.3 }, 1));
    expect(result.current.isPinching).toBe(true);

    rerender({ points: null, w: 800, h: 500 });
    expect(result.current).toMatchObject({ handDetected: false, isPinching: false, pinchProgress: 0 });

    rerender({ points: [], w: 800, h: 500 });
    expect(result.current.handDetected).toBe(false);
  });

  it("keeps the cursor inside a board that shrinks", () => {
    const { result, rerender } = render(null, 800, 500);
    rerender({ points: null, w: 200, h: 100 });
    expect(result.current.cursorX).toBeLessThanOrEqual(200);
    expect(result.current.cursorY).toBeLessThanOrEqual(100);
  });
});
