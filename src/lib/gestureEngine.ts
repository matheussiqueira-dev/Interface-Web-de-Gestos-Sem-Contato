import type { GestureEngineOptions, GestureState, SwipeDirection } from "@/types/gesture";
import type { HandLandmark } from "@/types/tracking";
import {
  computePinchConfidence,
  detectFist,
  detectPinch,
  detectSwipe,
  getHandScale,
} from "@/utils/gestures";
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

const SWIPE_HISTORY_SIZE = 8;

export interface GestureEngineFrameInput {
  landmarks: HandLandmark[];
  viewportWidth: number;
  viewportHeight: number;
  previousPinching: boolean;
  previousCursor: { x: number; y: number };
  options: GestureEngineOptions;
  cursorHistory?: ReadonlyArray<{ x: number; y: number }>;
}

export interface GestureEngineFrameOutput {
  state: GestureState;
  cursor: { x: number; y: number };
  isPinching: boolean;
}

/**
 * Creates the initial gesture state centered at the viewport midpoint.
 */
export function createInitialGestureState(width: number, height: number): GestureState {
  return {
    cursorX: width / 2,
    cursorY: height / 2,
    isPinching: false,
    isFist: false,
    handDetected: false,
    swipeDirection: null,
    gestureConfidence: 0,
  };
}

/**
 * Creates a new cursor history buffer sized to SWIPE_HISTORY_SIZE.
 * Use this to initialize the history in the consumer hook.
 */
export function createCursorHistory(): Array<{ x: number; y: number }> {
  return [];
}

/**
 * Appends a new cursor position to the history, evicting the oldest entry
 * when the buffer is full. Mutates the array in place for efficiency.
 */
export function pushCursorHistory(
  history: Array<{ x: number; y: number }>,
  point: { x: number; y: number },
): void {
  history.push({ x: point.x, y: point.y });
  if (history.length > SWIPE_HISTORY_SIZE) {
    history.shift();
  }
}

/**
 * Processes a single video frame of hand landmarks and computes the next gesture state.
 *
 * Applies:
 * - Adaptive smoothing proportional to cursor velocity
 * - Hysteresis-based pinch detection (start/stop thresholds differ)
 * - Hand-scale-normalized pinch thresholds for distance-invariant detection
 * - Swipe gesture classification from cursor motion history
 * - Confidence scoring for pinch strength
 */
export function computeGestureFrame(input: GestureEngineFrameInput): GestureEngineFrameOutput {
  const {
    landmarks,
    options,
    previousCursor,
    previousPinching,
    viewportHeight,
    viewportWidth,
    cursorHistory = [],
  } = input;

  const indexTip = landmarks[8];
  const rawPosition = landmarkToScreen(indexTip, viewportWidth, viewportHeight);
  const clampedPosition = {
    x: clamp(rawPosition.x, 0, viewportWidth),
    y: clamp(rawPosition.y, 0, viewportHeight),
  };

  const responsiveness = clamp(options.cursorResponsiveness ?? 1, 0.6, 1.7);
  const speed = Math.hypot(
    clampedPosition.x - previousCursor.x,
    clampedPosition.y - previousCursor.y,
  );
  const smoothFactor = clamp(
    (speed / SPEED_NORMALIZER) * responsiveness,
    MIN_SMOOTH,
    MAX_SMOOTH,
  );

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
  const gestureConfidence = computePinchConfidence(landmarks, pinchThreshold);

  const swipeResult = detectSwipe(cursorHistory);
  const swipeDirection: SwipeDirection | null = swipeResult?.direction ?? null;

  return {
    state: {
      cursorX: smoothX,
      cursorY: smoothY,
      isPinching,
      isFist,
      handDetected: true,
      swipeDirection,
      gestureConfidence,
    },
    cursor: { x: smoothX, y: smoothY },
    isPinching,
  };
}
