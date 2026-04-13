import { describe, expect, it } from "vitest";

import { clamp, landmarkToScreen, lerp } from "@/utils/geometry";

describe("clamp", () => {
  it("returns value unchanged when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below minimum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("returns max when value is above maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(7, 5, 5)).toBe(5);
  });

  it("returns boundary value when equal to min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns boundary value when equal to max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("lerp", () => {
  it("returns start value when t=0", () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it("returns end value when t=1", () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("returns midpoint when t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("interpolates correctly with non-zero start", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it("handles negative values", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it("handles extrapolation with t > 1", () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });
});

describe("landmarkToScreen", () => {
  it("maps center landmark (0.5, 0.5) to screen center", () => {
    const result = landmarkToScreen({ x: 0.5, y: 0.5 }, 1000, 800);
    expect(result.x).toBe(500);
    expect(result.y).toBe(400);
  });

  it("mirrors x axis (1 - x) for natural camera mirroring", () => {
    const result = landmarkToScreen({ x: 0, y: 0 }, 1000, 800);
    expect(result.x).toBe(1000);
    expect(result.y).toBe(0);
  });

  it("maps right edge landmark (x=1) to screen left", () => {
    const result = landmarkToScreen({ x: 1, y: 0 }, 1000, 800);
    expect(result.x).toBe(0);
  });

  it("scales y coordinate proportionally to height", () => {
    const result = landmarkToScreen({ x: 0.5, y: 1 }, 1000, 800);
    expect(result.y).toBe(800);
  });

  it("returns Point type with x and y properties", () => {
    const result = landmarkToScreen({ x: 0.3, y: 0.7 }, 640, 480);
    expect(result).toHaveProperty("x");
    expect(result).toHaveProperty("y");
  });
});
