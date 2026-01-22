// src/utils/geometry.ts

export interface Point {
    x: number;
    y: number;
}

export function landmarkToScreen(
    lm: { x: number; y: number },
    width: number,
    height: number
): Point {
    // MediaPipe x is normalized 0-1 (0 is left, 1 is right)
    // MediaPipe y is normalized 0-1 (0 is top, 1 is bottom)

    // We mirror 'x' because webcam feed is usually mirrored
    const x = (1 - lm.x) * width;
    const y = lm.y * height;

    return { x, y };
}

export function lerp(start: number, end: number, t: number) {
    return start * (1 - t) + end * t;
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}
