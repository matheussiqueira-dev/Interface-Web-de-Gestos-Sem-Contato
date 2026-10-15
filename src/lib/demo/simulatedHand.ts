import { clampNotePosition, getNoteSize, type Size } from "@/lib/workspace/layout";
import type { HandLandmark } from "@/types/tracking";
import type { WorkspaceNote } from "@/types/workspace";

/**
 * Simulated hand for the automatic demo. It produces the same 21-landmark
 * shape MediaPipe returns, so the demo runs through the real gesture engine
 * (smoothing, pinch thresholds, hysteresis) instead of faking its output.
 */

export interface Point {
  x: number;
  y: number;
}

/** A point of the demo timeline, in board pixels. pinch: 0 open, 1 closed. */
export interface ScriptKeyframe {
  at: number;
  x: number;
  y: number;
  pinch: number;
}

export interface DemoScene {
  notes: WorkspaceNote[];
  script: ScriptKeyframe[];
  durationMs: number;
}

const OPEN_GAP = 0.13;
const CLOSED_GAP = 0.012;

/**
 * Offsets from the index fingertip (landmark 8) for an upright open hand with
 * a palm scale of ~0.18 in normalized units. Fingertips sit above their
 * knuckles, so the fist detector never fires.
 */
const HAND_OFFSETS: Record<number, Point> = {
  0: { x: -0.03, y: 0.32 },
  1: { x: 0.05, y: 0.27 },
  2: { x: 0.08, y: 0.22 },
  3: { x: 0.09, y: 0.17 },
  5: { x: 0, y: 0.13 },
  6: { x: 0, y: 0.08 },
  7: { x: 0, y: 0.04 },
  8: { x: 0, y: 0 },
  9: { x: -0.04, y: 0.14 },
  10: { x: -0.04, y: 0.09 },
  11: { x: -0.04, y: 0.04 },
  12: { x: -0.04, y: -0.01 },
  13: { x: -0.08, y: 0.15 },
  14: { x: -0.08, y: 0.1 },
  15: { x: -0.08, y: 0.05 },
  16: { x: -0.08, y: 0.01 },
  17: { x: -0.12, y: 0.17 },
  18: { x: -0.12, y: 0.13 },
  19: { x: -0.12, y: 0.09 },
  20: { x: -0.12, y: 0.05 },
};

const THUMB_OPEN: Point = { x: 0.09, y: 0.1 };

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/**
 * Builds the 21 landmarks of a simulated hand whose index fingertip is at
 * `indexTip` (normalized camera coordinates) with the given pinch amount.
 */
export function buildHandLandmarks(indexTip: Point, pinch: number): HandLandmark[] {
  const amount = Math.min(Math.max(pinch, 0), 1);
  const gap = lerp(OPEN_GAP, CLOSED_GAP, amount);
  const openLength = Math.hypot(THUMB_OPEN.x, THUMB_OPEN.y);
  const thumbTip = {
    x: (THUMB_OPEN.x / openLength) * gap,
    y: (THUMB_OPEN.y / openLength) * gap,
  };

  return Array.from({ length: 21 }, (_, index) => {
    const offset = index === 4 ? thumbTip : HAND_OFFSETS[index];
    return { x: indexTip.x + offset.x, y: indexTip.y + offset.y, z: 0 };
  });
}

/**
 * Inverse of landmarkToScreen: the camera image is mirrored, so x flips.
 */
export function boardToLandmark(point: Point, board: Size): Point {
  return {
    x: 1 - point.x / Math.max(board.width, 1),
    y: point.y / Math.max(board.height, 1),
  };
}

/**
 * Samples the timeline at `elapsedMs`, looping over the script duration.
 * Position eases between keyframes; pinch changes linearly.
 */
export function sampleScript(script: readonly ScriptKeyframe[], elapsedMs: number): ScriptKeyframe {
  if (script.length === 0) {
    return { at: 0, x: 0, y: 0, pinch: 0 };
  }

  const duration = script[script.length - 1].at;
  const time = duration > 0 ? ((elapsedMs % duration) + duration) % duration : 0;

  for (let index = 1; index < script.length; index++) {
    const from = script[index - 1];
    const to = script[index];
    if (time <= to.at) {
      const span = to.at - from.at;
      const t = span > 0 ? (time - from.at) / span : 1;
      const eased = easeInOut(t);
      return {
        at: time,
        x: lerp(from.x, to.x, eased),
        y: lerp(from.y, to.y, eased),
        pinch: lerp(from.pinch, to.pinch, t),
      };
    }
  }

  return { ...script[script.length - 1], at: time };
}

/**
 * Lays out the demo notes for a board and the hand path that drags the first
 * note across the board and then draws a wave in free space.
 */
export function createDemoScene(board: Size): DemoScene {
  const note = getNoteSize(board.width);
  const created = "2026-01-01T00:00:00.000Z";

  const dragged = clampNotePosition({ x: 16, y: 16 }, board);
  const fixed = clampNotePosition({ x: board.width - note.width - 16, y: 16 }, board);
  const target = clampNotePosition(
    { x: board.width * 0.5 - note.width / 2, y: board.height * 0.38 },
    board,
  );

  const notes: WorkspaceNote[] = [
    {
      id: "demo-drag",
      x: dragged.x,
      y: dragged.y,
      color: "#6eb9ff",
      text: "A mão simulada fecha a pinça sobre esta nota e a arrasta.",
      createdAt: created,
      updatedAt: created,
    },
    {
      id: "demo-fixed",
      x: fixed.x,
      y: fixed.y,
      color: "#f8ba8a",
      text: "Na pinça sobre o espaço livre, o cursor desenha.",
      createdAt: created,
      updatedAt: created,
    },
  ];

  const grab = { x: dragged.x + note.width / 2, y: dragged.y + 20 };
  const drop = { x: target.x + note.width / 2, y: target.y + 20 };
  const rest = { x: board.width * 0.62, y: board.height * 0.72 };
  const drawY = board.height * 0.86;
  const drawStart = { x: board.width * 0.1, y: drawY };
  const wave = (fraction: number) => ({
    x: lerp(board.width * 0.1, board.width * 0.55, fraction),
    y: drawY - Math.sin(fraction * Math.PI * 2) * board.height * 0.05,
  });

  const script: ScriptKeyframe[] = [
    { at: 0, ...rest, pinch: 0 },
    { at: 1600, ...grab, pinch: 0 },
    { at: 2300, ...grab, pinch: 0 },
    { at: 2800, ...grab, pinch: 1 },
    { at: 4800, ...drop, pinch: 1 },
    { at: 5300, ...drop, pinch: 0 },
    { at: 6700, ...drawStart, pinch: 0 },
    { at: 7200, ...drawStart, pinch: 1 },
    { at: 7800, ...wave(0.25), pinch: 1 },
    { at: 8400, ...wave(0.5), pinch: 1 },
    { at: 9000, ...wave(0.75), pinch: 1 },
    { at: 9600, ...wave(1), pinch: 1 },
    { at: 10100, ...wave(1), pinch: 0 },
    { at: 11800, ...rest, pinch: 0 },
  ];

  return { notes, script, durationMs: script[script.length - 1].at };
}
