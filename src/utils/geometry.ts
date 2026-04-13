export interface Point {
  x: number;
  y: number;
}

/**
 * Converts a MediaPipe normalized landmark (x in [0,1], y in [0,1]) to screen
 * pixel coordinates. The x-axis is mirrored (1 - x) to match the natural
 * camera display where left/right appear correctly from the user's perspective.
 *
 * @param landmark - Normalized landmark with x and y in [0, 1]
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 */
export function landmarkToScreen(
  landmark: { x: number; y: number },
  width: number,
  height: number,
): Point {
  return {
    x: (1 - landmark.x) * width,
    y: landmark.y * height,
  };
}

/**
 * Linearly interpolates between start and end by factor t.
 * - t=0 returns start
 * - t=1 returns end
 * - t outside [0,1] extrapolates
 *
 * @param start - Starting value
 * @param end - Target value
 * @param t - Interpolation factor
 */
export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

/**
 * Constrains a value to the inclusive range [min, max].
 *
 * @param value - The value to constrain
 * @param min - Lower bound (inclusive)
 * @param max - Upper bound (inclusive)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
