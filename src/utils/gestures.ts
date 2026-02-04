// src/utils/gestures.ts
import type { HandLandmark } from "../types/hand";

function distance(a: HandLandmark, b: HandLandmark) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getHandScale(landmarks: HandLandmark[]): number {
    if (!landmarks || landmarks.length < 21) return 0;

    const palmWidth = distance(landmarks[5], landmarks[17]);
    const palmLength = distance(landmarks[0], landmarks[9]);

    return Math.max(palmWidth, palmLength);
}

// Thumb Tip: 4, Index Tip: 8
export function detectPinch(landmarks: HandLandmark[], threshold = 0.05): boolean {
    if (!landmarks || landmarks.length < 21) return false;

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const d = distance(thumbTip, indexTip);

    return d < threshold;
}

// Fist: fingers curled down
export function detectFist(landmarks: HandLandmark[]): boolean {
    if (!landmarks || landmarks.length < 21) return false;

    const pairs = [
        [8, 5],   // Index
        [12, 9],  // Middle
        [16, 13], // Ring
        [20, 17], // Pinky
    ] as const;

    // Check if tip is below the base joint (higher y value means lower on screen)
    return pairs.every(([tip, base]) => landmarks[tip].y > landmarks[base].y);
}
