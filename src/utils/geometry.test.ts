import { describe, expect, it } from "vitest";

import { clamp, landmarkToScreen, lerp } from "./geometry";

describe("geometry utilities", () => {
  it("clamps number inside bounds", () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-2, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it("interpolates values with lerp", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("maps landmarks to mirrored screen coordinates", () => {
    const point = landmarkToScreen({ x: 0.25, y: 0.6 }, 1200, 800);
    expect(point.x).toBeCloseTo(900);
    expect(point.y).toBeCloseTo(480);
  });
});
