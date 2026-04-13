import { describe, expect, it } from "vitest";

import { detectFist, detectPinch, getHandScale } from "@/utils/gestures";
import type { HandLandmark } from "@/types/tracking";

function makeLandmarks(overrides: Partial<Record<number, Partial<HandLandmark>>> = {}): HandLandmark[] {
  const base: HandLandmark[] = Array.from({ length: 21 }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    ...overrides[i],
  }));
  return base;
}

describe("getHandScale", () => {
  it("returns 0 when fewer than 21 landmarks provided", () => {
    const landmarks = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(getHandScale(landmarks)).toBe(0);
  });

  it("returns palm width when it exceeds palm length", () => {
    const landmarks = makeLandmarks({
      0: { x: 0.5, y: 0.5 },
      5: { x: 0.1, y: 0.5 },
      9: { x: 0.5, y: 0.5 },
      17: { x: 0.9, y: 0.5 },
    });
    const scale = getHandScale(landmarks);
    expect(scale).toBeGreaterThan(0);
  });

  it("returns a positive number for a valid hand", () => {
    const landmarks = makeLandmarks({
      0: { x: 0.5, y: 0.8 },
      5: { x: 0.3, y: 0.5 },
      9: { x: 0.5, y: 0.5 },
      17: { x: 0.7, y: 0.5 },
    });
    expect(getHandScale(landmarks)).toBeGreaterThan(0);
  });
});

describe("detectPinch", () => {
  it("returns false when fewer than 21 landmarks provided", () => {
    const landmarks = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(detectPinch(landmarks)).toBe(false);
  });

  it("returns true when thumb tip and index tip are close", () => {
    const landmarks = makeLandmarks({
      4: { x: 0.5, y: 0.5 },
      8: { x: 0.502, y: 0.5 },
    });
    expect(detectPinch(landmarks, 0.05)).toBe(true);
  });

  it("returns false when thumb tip and index tip are far apart", () => {
    const landmarks = makeLandmarks({
      4: { x: 0.1, y: 0.1 },
      8: { x: 0.9, y: 0.9 },
    });
    expect(detectPinch(landmarks, 0.05)).toBe(false);
  });

  it("uses custom threshold correctly", () => {
    const landmarks = makeLandmarks({
      4: { x: 0.5, y: 0.5 },
      8: { x: 0.56, y: 0.5 },
    });
    expect(detectPinch(landmarks, 0.05)).toBe(false);
    expect(detectPinch(landmarks, 0.1)).toBe(true);
  });
});

describe("detectFist", () => {
  it("returns false when fewer than 21 landmarks provided", () => {
    const landmarks = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(detectFist(landmarks)).toBe(false);
  });

  it("returns true when all finger tips are below their MCP joints (closed fist)", () => {
    const landmarks = makeLandmarks({
      5: { y: 0.3 },
      8: { y: 0.7 },
      9: { y: 0.3 },
      12: { y: 0.7 },
      13: { y: 0.3 },
      16: { y: 0.7 },
      17: { y: 0.3 },
      20: { y: 0.7 },
    });
    expect(detectFist(landmarks)).toBe(true);
  });

  it("returns false when fingers are extended (tips above MCP joints)", () => {
    const landmarks = makeLandmarks({
      5: { y: 0.7 },
      8: { y: 0.3 },
      9: { y: 0.7 },
      12: { y: 0.3 },
      13: { y: 0.7 },
      16: { y: 0.3 },
      17: { y: 0.7 },
      20: { y: 0.3 },
    });
    expect(detectFist(landmarks)).toBe(false);
  });

  it("returns false when only some fingers are curled", () => {
    const landmarks = makeLandmarks({
      5: { y: 0.3 },
      8: { y: 0.7 },
      9: { y: 0.3 },
      12: { y: 0.7 },
      13: { y: 0.3 },
      16: { y: 0.7 },
      17: { y: 0.7 },
      20: { y: 0.3 },
    });
    expect(detectFist(landmarks)).toBe(false);
  });
});
