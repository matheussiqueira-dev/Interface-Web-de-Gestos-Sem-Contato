import { describe, expect, it } from "vitest";

import {
  computeGestureFrame,
  createInitialGestureState,
  type GestureEngineFrameInput,
} from "@/lib/gestureEngine";
import type { HandLandmark } from "@/types/tracking";

function makeLandmarks(overrides: Partial<Record<number, Partial<HandLandmark>>> = {}): HandLandmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    ...overrides[i],
  }));
}

function makeFrameInput(overrides: Partial<GestureEngineFrameInput> = {}): GestureEngineFrameInput {
  return {
    landmarks: makeLandmarks(),
    viewportWidth: 1000,
    viewportHeight: 800,
    previousPinching: false,
    previousCursor: { x: 500, y: 400 },
    options: { pinchSensitivity: 1, cursorResponsiveness: 1 },
    ...overrides,
  };
}

describe("createInitialGestureState", () => {
  it("centers cursor at viewport midpoint", () => {
    const state = createInitialGestureState(1000, 800);
    expect(state.cursorX).toBe(500);
    expect(state.cursorY).toBe(400);
  });

  it("initializes all gesture flags to false", () => {
    const state = createInitialGestureState(1280, 720);
    expect(state.isPinching).toBe(false);
    expect(state.isFist).toBe(false);
    expect(state.handDetected).toBe(false);
  });

  it("handles zero dimensions without crashing", () => {
    const state = createInitialGestureState(0, 0);
    expect(state.cursorX).toBe(0);
    expect(state.cursorY).toBe(0);
  });
});

describe("computeGestureFrame", () => {
  it("sets handDetected to true when landmarks are provided", () => {
    const output = computeGestureFrame(makeFrameInput());
    expect(output.state.handDetected).toBe(true);
  });

  it("returns smoothed cursor position (not raw landmark)", () => {
    const input = makeFrameInput({
      landmarks: makeLandmarks({ 8: { x: 0.9, y: 0.1 } }),
      previousCursor: { x: 500, y: 400 },
    });
    const output = computeGestureFrame(input);
    expect(output.cursor.x).not.toBe(100);
    expect(output.cursor.y).not.toBe(80);
  });

  it("detects pinch when thumb and index tips are very close", () => {
    const landmarks = makeLandmarks({
      4: { x: 0.501, y: 0.501 },
      8: { x: 0.501, y: 0.501 },
    });
    const output = computeGestureFrame(makeFrameInput({ landmarks }));
    expect(output.isPinching).toBe(true);
    expect(output.state.isPinching).toBe(true);
  });

  it("detects fist when all finger tips are below MCP joints", () => {
    const landmarks = makeLandmarks({
      5: { y: 0.3 }, 8: { y: 0.7 },
      9: { y: 0.3 }, 12: { y: 0.7 },
      13: { y: 0.3 }, 16: { y: 0.7 },
      17: { y: 0.3 }, 20: { y: 0.7 },
    });
    const output = computeGestureFrame(makeFrameInput({ landmarks }));
    expect(output.state.isFist).toBe(true);
  });

  it("clamps cursor position within viewport bounds", () => {
    const input = makeFrameInput({
      landmarks: makeLandmarks({ 8: { x: -0.5, y: 1.5 } }),
    });
    const output = computeGestureFrame(input);
    expect(output.cursor.x).toBeGreaterThanOrEqual(0);
    expect(output.cursor.x).toBeLessThanOrEqual(input.viewportWidth);
    expect(output.cursor.y).toBeGreaterThanOrEqual(0);
    expect(output.cursor.y).toBeLessThanOrEqual(input.viewportHeight);
  });

  it("applies higher smoothing when cursor moves slowly", () => {
    const nearbyInput = makeFrameInput({
      landmarks: makeLandmarks({ 8: { x: 0.501, y: 0.501 } }),
      previousCursor: { x: 500, y: 400 },
    });
    const farInput = makeFrameInput({
      landmarks: makeLandmarks({ 8: { x: 0.1, y: 0.1 } }),
      previousCursor: { x: 500, y: 400 },
    });

    const nearOutput = computeGestureFrame(nearbyInput);
    const farOutput = computeGestureFrame(farInput);

    const nearDelta = Math.abs(nearOutput.cursor.x - 500);
    const farDelta = Math.abs(farOutput.cursor.x - 500);
    expect(farDelta).toBeGreaterThan(nearDelta);
  });

  it("respects pinch hysteresis (higher threshold to stop pinch)", () => {
    const landmarks = makeLandmarks({
      4: { x: 0.52, y: 0.5 },
      8: { x: 0.5, y: 0.5 },
    });

    const startOutput = computeGestureFrame(makeFrameInput({
      landmarks,
      previousPinching: false,
    }));

    const stopOutput = computeGestureFrame(makeFrameInput({
      landmarks,
      previousPinching: true,
    }));

    expect(startOutput.isPinching).toBe(false);
    expect(stopOutput.isPinching).toBe(true);
  });

  it("output cursor coordinates match state coordinates", () => {
    const output = computeGestureFrame(makeFrameInput());
    expect(output.cursor.x).toBe(output.state.cursorX);
    expect(output.cursor.y).toBe(output.state.cursorY);
  });
});
