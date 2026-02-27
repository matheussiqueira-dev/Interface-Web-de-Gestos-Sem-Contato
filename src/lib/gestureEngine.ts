import type { GestureEngineOptions, GestureState } from "@/types/gesture";
import type { HandLandmark } from "@/types/tracking";
import { detectFist, detectPinch, getHandScale } from "@/utils/gestures";
import { clamp, landmarkToScreen, lerp } from "@/utils/geometry";

const MIN_SMOOTH = 0.08;
const MAX_SMOOTH = 0.32;
const SPEED_NORMALIZER = 120;

const START_PINCH_ABS = 0.05;
const STOP_PINCH_ABS = 0.085;
const START_PINCH_RATIO = 0.3;
const STOP_PINCH_RATIO = 0.4;
const MIN_PINCH_ABS = 0.025;
const MAX_PINCH_ABS = 0.12;

export interface GestureEngineFrameInput {
  landmarks: HandLandmark[];
  viewportWidth: number;
  viewportHeight: number;
  previousPinching: boolean;
  previousCursor: { x: number; y: number };
  options: GestureEngineOptions;
}

export interface GestureEngineFrameOutput {
  state: GestureState;
  cursor: { x: number; y: number };
  isPinching: boolean;
}

export function createInitialGestureState(width: number, height: number): GestureState {
  return {
    cursorX: width / 2,
    cursorY: height / 2,
    isPinching: false,
    isFist: false,
    handDetected: false,
  };
}

export function computeGestureFrame(input: GestureEngineFrameInput): GestureEngineFrameOutput {
  const { landmarks, options, previousCursor, previousPinching, viewportHeight, viewportWidth } =
    input;

  const indexTip = landmarks[8];
  const rawPosition = landmarkToScreen(indexTip, viewportWidth, viewportHeight);
  const clampedPosition = {
    x: clamp(rawPosition.x, 0, viewportWidth),
    y: clamp(rawPosition.y, 0, viewportHeight),
  };

  const responsiveness = clamp(options.cursorResponsiveness ?? 1, 0.6, 1.7);
  const speed = Math.hypot(clampedPosition.x - previousCursor.x, clampedPosition.y - previousCursor.y);
  const smoothFactor = clamp((speed / SPEED_NORMALIZER) * responsiveness, MIN_SMOOTH, MAX_SMOOTH);

  const smoothX = lerp(previousCursor.x, clampedPosition.x, smoothFactor);
  const smoothY = lerp(previousCursor.y, clampedPosition.y, smoothFactor);

  const handScale = getHandScale(landmarks);
  const ratioThreshold =
    (previousPinching ? STOP_PINCH_RATIO : START_PINCH_RATIO) * Math.max(handScale, 0.0001);
  const fallbackThreshold = previousPinching ? STOP_PINCH_ABS : START_PINCH_ABS;
  const baseThreshold = handScale
    ? clamp(ratioThreshold, MIN_PINCH_ABS, MAX_PINCH_ABS)
    : fallbackThreshold;

  const sensitivity = clamp(options.pinchSensitivity ?? 1, 0.6, 1.7);
  const pinchThreshold = clamp(baseThreshold * sensitivity, MIN_PINCH_ABS, MAX_PINCH_ABS);

  const isPinching = detectPinch(landmarks, pinchThreshold);
  const isFist = detectFist(landmarks);

  return {
    state: {
      cursorX: smoothX,
      cursorY: smoothY,
      isPinching,
      isFist,
      handDetected: true,
    },
    cursor: { x: smoothX, y: smoothY },
    isPinching,
  };
}
