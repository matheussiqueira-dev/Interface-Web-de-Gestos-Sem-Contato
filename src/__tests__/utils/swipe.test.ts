import { describe, expect, it } from "vitest";

import { detectSwipe } from "@/utils/gestures";

function makeHistory(points: Array<{ x: number; y: number }>) {
  return points;
}

describe("detectSwipe", () => {
  it("returns null when history has fewer than 6 points", () => {
    const history = makeHistory([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
    expect(detectSwipe(history)).toBeNull();
  });

  it("returns null when movement velocity is below threshold", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: i * 0.5, y: 0 })),
    );
    expect(detectSwipe(history, 6)).toBeNull();
  });

  it("detects right swipe when dominant motion is positive x", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: i * 20, y: 0 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.direction).toBe("right");
  });

  it("detects left swipe when dominant motion is negative x", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: 200 - i * 20, y: 0 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.direction).toBe("left");
  });

  it("detects down swipe when dominant motion is positive y", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i * 20 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.direction).toBe("down");
  });

  it("detects up swipe when dominant motion is negative y", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: 0, y: 200 - i * 20 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.direction).toBe("up");
  });

  it("prefers x-axis when x and y displacement are equal", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: i * 20, y: i * 20 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.direction).toBe("right");
  });

  it("returns velocity alongside direction", () => {
    const history = makeHistory(
      Array.from({ length: 8 }, (_, i) => ({ x: i * 20, y: 0 })),
    );
    const result = detectSwipe(history, 6);
    expect(result?.velocity).toBeGreaterThan(0);
  });
});
