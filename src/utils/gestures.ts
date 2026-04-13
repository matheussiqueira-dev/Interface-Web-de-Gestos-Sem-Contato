import type { SwipeDirection, SwipeVector } from "@/types/gesture";
import type { HandLandmark } from "@/types/tracking";

const SWIPE_VELOCITY_THRESHOLD = 6;
const SWIPE_HISTORY_FRAMES = 6;

/**
 * Computes the Euclidean distance between two hand landmarks in normalized space.
 */
export function distance(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns a normalized hand scale based on the maximum of palm width and palm length.
 * Returns 0 if the landmark set is incomplete.
 */
export function getHandScale(landmarks: HandLandmark[]): number {
  if (landmarks.length < 21) {
    return 0;
  }

  const palmWidth = distance(landmarks[5], landmarks[17]);
  const palmLength = distance(landmarks[0], landmarks[9]);
  return Math.max(palmWidth, palmLength);
}

/**
 * Detects a pinch gesture by measuring the distance between the thumb tip (4)
 * and index finger tip (8) against the given threshold.
 */
export function detectPinch(landmarks: HandLandmark[], threshold = 0.05): boolean {
  if (landmarks.length < 21) {
    return false;
  }

  return distance(landmarks[4], landmarks[8]) < threshold;
}

/**
 * Detects a closed fist by verifying that all four finger tips are positioned
 * below (higher y value) their respective MCP joints in normalized space.
 */
export function detectFist(landmarks: HandLandmark[]): boolean {
  if (landmarks.length < 21) {
    return false;
  }

  const pairs = [
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17],
  ] as const;

  return pairs.every(([tip, base]) => landmarks[tip].y > landmarks[base].y);
}

/**
 * Detects a swipe gesture by analyzing the velocity and dominant axis of motion
 * from a recent position history buffer. Returns null when no swipe is detected.
 *
 * @param history - Circular buffer of recent cursor positions (oldest first)
 * @param minVelocity - Minimum pixels-per-frame velocity to qualify as a swipe
 */
export function detectSwipe(
  history: ReadonlyArray<{ x: number; y: number }>,
  minVelocity = SWIPE_VELOCITY_THRESHOLD,
): SwipeVector | null {
  if (history.length < SWIPE_HISTORY_FRAMES) {
    return null;
  }

  const oldest = history[0];
  const newest = history[history.length - 1];
  const dx = newest.x - oldest.x;
  const dy = newest.y - oldest.y;
  const velocity = Math.hypot(dx, dy) / history.length;

  if (velocity < minVelocity) {
    return null;
  }

  let direction: SwipeDirection;
  if (Math.abs(dx) >= Math.abs(dy)) {
    direction = dx < 0 ? "left" : "right";
  } else {
    direction = dy < 0 ? "up" : "down";
  }

  return { direction, velocity };
}

/**
 * Computes a confidence score [0, 1] for the current pinch gesture based on
 * how close the thumb and index tips are relative to the detection threshold.
 */
export function computePinchConfidence(
  landmarks: HandLandmark[],
  threshold: number,
): number {
  if (landmarks.length < 21) {
    return 0;
  }

  const d = distance(landmarks[4], landmarks[8]);
  if (d >= threshold) {
    return 0;
  }

  return Math.max(0, 1 - d / threshold);
}
