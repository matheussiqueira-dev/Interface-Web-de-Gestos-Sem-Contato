export interface Point {
  x: number;
  y: number;
}

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

export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
