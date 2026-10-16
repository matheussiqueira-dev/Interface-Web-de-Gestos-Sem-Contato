import { describe, expect, it } from "vitest";

import {
  boardToLandmark,
  buildHandLandmarks,
  createDemoScene,
  sampleScript,
  type ScriptKeyframe,
} from "@/lib/demo/simulatedHand";
import { computeGestureFrame } from "@/lib/gestureEngine";
import { getNoteSize, type Size } from "@/lib/workspace/layout";
import { detectFist, detectPinch, getHandScale } from "@/utils/gestures";
import { landmarkToScreen } from "@/utils/geometry";

describe("buildHandLandmarks", () => {
  it("returns 21 landmarks with the index fingertip at the requested point", () => {
    const hand = buildHandLandmarks({ x: 0.4, y: 0.3 }, 0);
    expect(hand).toHaveLength(21);
    expect(hand[8]).toEqual({ x: 0.4, y: 0.3, z: 0 });
  });

  it("is an open, non-fist hand with a realistic palm scale", () => {
    const hand = buildHandLandmarks({ x: 0.5, y: 0.3 }, 0);
    expect(detectFist(hand)).toBe(false);
    expect(getHandScale(hand)).toBeGreaterThan(0.15);
    expect(getHandScale(hand)).toBeLessThan(0.2);
  });

  it("closes the thumb-index gap as pinch goes from 0 to 1", () => {
    const threshold = 0.05;
    expect(detectPinch(buildHandLandmarks({ x: 0.5, y: 0.3 }, 0), threshold)).toBe(false);
    expect(detectPinch(buildHandLandmarks({ x: 0.5, y: 0.3 }, 1), threshold)).toBe(true);
  });

  it("clamps pinch outside [0, 1]", () => {
    expect(buildHandLandmarks({ x: 0.5, y: 0.3 }, 3)).toEqual(
      buildHandLandmarks({ x: 0.5, y: 0.3 }, 1),
    );
  });
});

describe("boardToLandmark", () => {
  it("is the inverse of landmarkToScreen (mirrored x)", () => {
    const board = { width: 800, height: 500 };
    const landmark = boardToLandmark({ x: 200, y: 100 }, board);
    expect(landmark.x).toBeCloseTo(0.75);
    expect(landmark.y).toBeCloseTo(0.2);
    const back = landmarkToScreen(landmark, board.width, board.height);
    expect(back.x).toBeCloseTo(200);
    expect(back.y).toBeCloseTo(100);
  });
});

describe("sampleScript", () => {
  const script: ScriptKeyframe[] = [
    { at: 0, x: 0, y: 0, pinch: 0 },
    { at: 1000, x: 100, y: 50, pinch: 1 },
    { at: 2000, x: 100, y: 50, pinch: 0 },
  ];

  it("returns keyframe values at their timestamps", () => {
    expect(sampleScript(script, 0)).toMatchObject({ x: 0, y: 0, pinch: 0 });
    expect(sampleScript(script, 1000)).toMatchObject({ x: 100, y: 50, pinch: 1 });
  });

  it("eases position and interpolates pinch linearly", () => {
    const middle = sampleScript(script, 500);
    expect(middle.x).toBeCloseTo(50);
    expect(middle.pinch).toBeCloseTo(0.5);
    expect(sampleScript(script, 250).x).toBeLessThan(25);
  });

  it("loops over the script duration", () => {
    expect(sampleScript(script, 2500)).toMatchObject({ x: 50, pinch: 0.5 });
  });

  it("handles empty and single-frame scripts", () => {
    expect(sampleScript([], 100)).toEqual({ at: 0, x: 0, y: 0, pinch: 0 });
    expect(sampleScript([{ at: 0, x: 5, y: 6, pinch: 1 }], 100)).toMatchObject({ x: 5, y: 6 });
  });
});

describe("createDemoScene", () => {
  it.each([
    { width: 337, height: 460 },
    { width: 1100, height: 620 },
  ])("keeps notes inside a $width x $height board", (board) => {
    const scene = createDemoScene(board);
    const note = getNoteSize(board.width);
    expect(scene.notes).toHaveLength(2);
    for (const item of scene.notes) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.x + note.width).toBeLessThanOrEqual(board.width);
      expect(item.y + note.height).toBeLessThanOrEqual(board.height);
    }
    expect(scene.durationMs).toBe(scene.script[scene.script.length - 1].at);

    const [first, second] = scene.notes;
    const overlaps =
      first.x < second.x + note.width &&
      second.x < first.x + note.width &&
      first.y < second.y + note.height &&
      second.y < first.y + note.height;
    expect(overlaps).toBe(false);
  });

  it.each([
    { width: 337, height: 460 },
    { width: 1100, height: 620 },
  ])("drives the real engine: grabs the note, then draws in free space ($width px)", (board) => {
    const scene = createDemoScene(board);
    const note = getNoteSize(board.width);
    const draggable = scene.notes[0];

    let cursor = { x: board.width / 2, y: board.height / 2 };
    let pinching = false;
    const pinchStarts: Array<{ x: number; y: number; at: number }> = [];

    for (let elapsed = 0; elapsed <= scene.durationMs; elapsed += 1000 / 30) {
      const frame = sampleScript(scene.script, elapsed);
      const landmarks = buildHandLandmarks(boardToLandmark(frame, board), frame.pinch);
      const output = computeGestureFrame({
        landmarks,
        viewportWidth: board.width,
        viewportHeight: board.height,
        previousPinching: pinching,
        previousCursor: cursor,
        options: { pinchSensitivity: 1, cursorResponsiveness: 1 },
      });

      expect(output.state.isFist).toBe(false);
      if (output.isPinching && !pinching) {
        pinchStarts.push({ ...output.cursor, at: elapsed });
      }
      cursor = output.cursor;
      pinching = output.isPinching;
    }

    expect(pinchStarts).toHaveLength(2);

    const [grab, draw] = pinchStarts;
    const insideNote = (point: { x: number; y: number }, size: Size) =>
      point.x >= draggable.x &&
      point.x <= draggable.x + size.width &&
      point.y >= draggable.y &&
      point.y <= draggable.y + size.height;

    expect(insideNote(grab, note)).toBe(true);
    expect(insideNote(draw, note)).toBe(false);
    expect(draw.y).toBeGreaterThan(board.height * 0.7);
  });
});
