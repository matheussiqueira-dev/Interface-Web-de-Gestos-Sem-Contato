import { describe, expect, it } from "vitest";

import type { HandLandmark } from "../types/hand";
import { detectFist, detectPinch, getHandScale } from "./gestures";

function createOpenHand(): HandLandmark[] {
  const points: HandLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  points[0] = { x: 0.5, y: 0.75, z: 0 };
  points[4] = { x: 0.46, y: 0.36, z: 0 };
  points[5] = { x: 0.43, y: 0.63, z: 0 };
  points[8] = { x: 0.6, y: 0.3, z: 0 };
  points[9] = { x: 0.5, y: 0.6, z: 0 };
  points[12] = { x: 0.56, y: 0.25, z: 0 };
  points[13] = { x: 0.54, y: 0.62, z: 0 };
  points[16] = { x: 0.5, y: 0.24, z: 0 };
  points[17] = { x: 0.62, y: 0.64, z: 0 };
  points[20] = { x: 0.45, y: 0.26, z: 0 };

  return points;
}

describe("gesture heuristics", () => {
  it("detects pinch when thumb/index are close", () => {
    const hand = createOpenHand();
    hand[4] = { x: 0.51, y: 0.34, z: 0 };
    hand[8] = { x: 0.53, y: 0.35, z: 0 };
    expect(detectPinch(hand, 0.05)).toBe(true);
  });

  it("detects open hand as not fist", () => {
    const hand = createOpenHand();
    expect(detectFist(hand)).toBe(false);
  });

  it("detects fist when finger tips are below base joints", () => {
    const hand = createOpenHand();
    hand[8].y = 0.78;
    hand[12].y = 0.8;
    hand[16].y = 0.81;
    hand[20].y = 0.82;

    expect(detectFist(hand)).toBe(true);
  });

  it("returns positive hand scale for valid landmarks", () => {
    const hand = createOpenHand();
    expect(getHandScale(hand)).toBeGreaterThan(0);
  });
});
