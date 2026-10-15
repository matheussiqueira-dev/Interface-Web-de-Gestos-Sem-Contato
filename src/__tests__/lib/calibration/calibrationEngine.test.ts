import { describe, expect, it } from "vitest";

import {
  advanceCalibration,
  createInitialCalibrationState,
  resetCalibration,
  startCalibration,
  type CalibrationState,
} from "@/lib/calibration/calibrationEngine";
import type { HandLandmark } from "@/types/tracking";

const REQUIRED_SAMPLES = 20;
const STEP_MS = 100;

interface HandShape {
  /** Palm landmarks 0, 5, 9, 17 (determine hand scale) */
  palm?: Partial<Record<0 | 5 | 9 | 17, { x: number; y: number }>>;
  thumb: { x: number; y: number };
  index: { x: number; y: number };
}

// Default palm: width 0.2 (5 -> 17), length 0.3 (0 -> 9) => hand scale 0.3
const DEFAULT_PALM = {
  0: { x: 0.5, y: 0.8 },
  5: { x: 0.4, y: 0.5 },
  9: { x: 0.5, y: 0.5 },
  17: { x: 0.6, y: 0.5 },
};

function makeHand({ palm = {}, thumb, index }: HandShape): HandLandmark[] {
  const points: Record<number, { x: number; y: number }> = {
    ...DEFAULT_PALM,
    ...palm,
    4: thumb,
    8: index,
  };
  return Array.from({ length: 21 }, (_, i) => ({
    x: points[i]?.x ?? 0.5,
    y: points[i]?.y ?? 0.5,
    z: 0,
  }));
}

const OPEN_HAND = makeHand({ thumb: { x: 0.5, y: 0.58 }, index: { x: 0.5, y: 0.3 } }); // gap 0.28
const PINCH_HAND = makeHand({ thumb: { x: 0.5, y: 0.31 }, index: { x: 0.5, y: 0.3 } }); // gap 0.01

function feed(
  state: CalibrationState,
  landmarks: HandLandmark[],
  count: number,
  startAt: number,
): { state: CalibrationState; now: number } {
  let current = state;
  let now = startAt;
  for (let i = 0; i < count; i++) {
    current = advanceCalibration(current, landmarks, now);
    now += STEP_MS;
  }
  return { state: current, now };
}

function calibrate(open: HandLandmark[], pinch: HandLandmark[]): CalibrationState {
  const afterOpen = feed(startCalibration(createInitialCalibrationState()), open, REQUIRED_SAMPLES, 0);
  return feed(afterOpen.state, pinch, REQUIRED_SAMPLES, afterOpen.now).state;
}

describe("calibration state helpers", () => {
  it("creates an idle initial state", () => {
    expect(createInitialCalibrationState()).toEqual({
      step: "idle",
      progress: 0,
      samples: [],
      profile: null,
      error: null,
    });
  });

  it("startCalibration moves to open_hand with a clean state", () => {
    const dirty: CalibrationState = {
      ...createInitialCalibrationState(),
      step: "failed",
      progress: 40,
      error: "x",
    };
    expect(startCalibration(dirty)).toEqual({
      step: "open_hand",
      progress: 0,
      samples: [],
      profile: null,
      error: null,
    });
  });

  it("resetCalibration returns to idle", () => {
    expect(resetCalibration().step).toBe("idle");
  });
});

describe("advanceCalibration", () => {
  it.each(["idle", "complete", "failed"] as const)("ignores frames while %s", (step) => {
    const state = { ...createInitialCalibrationState(), step };
    expect(advanceCalibration(state, OPEN_HAND, 0)).toBe(state);
  });

  it("keeps waiting silently when no hand is visible during open_hand", () => {
    const state = startCalibration(createInitialCalibrationState());
    expect(advanceCalibration(state, null, 0)).toBe(state);
  });

  it("reports a missing hand after the open_hand step", () => {
    const state: CalibrationState = { ...createInitialCalibrationState(), step: "pinch_start" };
    const next = advanceCalibration(state, null, 0);
    expect(next.error).toMatch(/Mao nao detectada/);
  });

  it("treats incomplete landmark sets as a missing hand", () => {
    const state: CalibrationState = { ...createInitialCalibrationState(), step: "pinch_hold" };
    expect(advanceCalibration(state, OPEN_HAND.slice(0, 10), 0).error).toMatch(/Mao nao detectada/);
  });

  it("throttles samples closer than the sampling interval", () => {
    const first = advanceCalibration(startCalibration(createInitialCalibrationState()), OPEN_HAND, 1000);
    const second = advanceCalibration(first, OPEN_HAND, 1050);
    expect(second).toBe(first);
    expect(first.samples).toHaveLength(1);
  });

  it("asks the user to open the hand when pinching during open_hand", () => {
    const next = advanceCalibration(startCalibration(createInitialCalibrationState()), PINCH_HAND, 0);
    expect(next.error).toMatch(/Abra a mao/);
    expect(next.samples).toHaveLength(0);
  });

  it("collects open-hand samples and advances to pinch_start at 50%", () => {
    const start = startCalibration(createInitialCalibrationState());
    const partial = feed(start, OPEN_HAND, 10, 0).state;
    expect(partial.step).toBe("open_hand");
    expect(partial.progress).toBe(25);

    const done = feed(start, OPEN_HAND, REQUIRED_SAMPLES, 0).state;
    expect(done.step).toBe("pinch_start");
    expect(done.progress).toBe(50);
    expect(done.samples).toHaveLength(REQUIRED_SAMPLES);
  });

  it("moves through pinch_hold and completes with a profile at 100%", () => {
    const afterOpen = feed(startCalibration(createInitialCalibrationState()), OPEN_HAND, REQUIRED_SAMPLES, 0);
    const holding = feed(afterOpen.state, PINCH_HAND, 5, afterOpen.now).state;
    expect(holding.step).toBe("pinch_hold");
    expect(holding.progress).toBe(62.5);

    const complete = calibrate(OPEN_HAND, PINCH_HAND);
    expect(complete.step).toBe("complete");
    expect(complete.progress).toBe(100);
    expect(complete.profile).not.toBeNull();
    expect(complete.profile?.handScale).toBeCloseTo(0.3);
    expect(() => new Date(complete.profile!.capturedAt).toISOString()).not.toThrow();
  });

  it("leaves unsupported steps untouched", () => {
    const state: CalibrationState = { ...createInitialCalibrationState(), step: "fist" };
    expect(advanceCalibration(state, OPEN_HAND, 0)).toBe(state);
  });
});

describe("calibration profile recommendations", () => {
  it("recommends low pinch sensitivity and responsiveness for a wide spread on a large hand", () => {
    // open ratio 0.28/0.3 ≈ 0.93, pinch ratio ≈ 0.03 => spread > 0.4; scale 0.3 > 0.25
    const profile = calibrate(OPEN_HAND, PINCH_HAND).profile!;
    expect(profile.recommendedPinchSensitivity).toBe(0.8);
    expect(profile.recommendedCursorResponsiveness).toBe(0.9);
  });

  it("recommends default sensitivity for a medium spread on a medium hand", () => {
    // Palm scale 0.2; open gap 0.14 (ratio 0.7), pinch gap 0.08 (ratio 0.4) => spread 0.3
    const palm = { 0: { x: 0.5, y: 0.7 } };
    const open = makeHand({ palm, thumb: { x: 0.5, y: 0.44 }, index: { x: 0.5, y: 0.3 } });
    const pinch = makeHand({ palm, thumb: { x: 0.5, y: 0.38 }, index: { x: 0.5, y: 0.3 } });
    const profile = calibrate(open, pinch).profile!;
    expect(profile.recommendedPinchSensitivity).toBe(1.0);
    expect(profile.recommendedCursorResponsiveness).toBe(1.0);
  });

  it("recommends high sensitivity for a narrow spread on a small hand", () => {
    // Palm scale 0.1; open gap 0.07 (ratio 0.7), pinch gap 0.05 (ratio 0.5) => spread 0.2
    const palm = { 0: { x: 0.5, y: 0.6 }, 5: { x: 0.45, y: 0.5 }, 17: { x: 0.55, y: 0.5 } };
    const open = makeHand({ palm, thumb: { x: 0.5, y: 0.37 }, index: { x: 0.5, y: 0.3 } });
    const pinch = makeHand({ palm, thumb: { x: 0.5, y: 0.35 }, index: { x: 0.5, y: 0.3 } });
    const profile = calibrate(open, pinch).profile!;
    expect(profile.recommendedPinchSensitivity).toBe(1.3);
    expect(profile.recommendedCursorResponsiveness).toBe(1.2);
  });

  it("falls back to default ratios when the hand scale is zero", () => {
    // Collapsed palm => scale 0; fallback ratios 0.3 / 0.8 give spread 0.5
    const palm = {
      0: { x: 0.5, y: 0.5 },
      5: { x: 0.5, y: 0.5 },
      9: { x: 0.5, y: 0.5 },
      17: { x: 0.5, y: 0.5 },
    };
    const open = makeHand({ palm, thumb: { x: 0.5, y: 0.58 }, index: { x: 0.5, y: 0.3 } });
    const profile = calibrate(open, open).profile!;
    expect(profile.handScale).toBe(0);
    expect(profile.recommendedPinchSensitivity).toBe(0.8);
    expect(profile.recommendedCursorResponsiveness).toBe(1.2);
  });
});
