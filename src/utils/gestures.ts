import type { HandLandmark } from "@/types/tracking";

function distance(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getHandScale(landmarks: HandLandmark[]): number {
  if (landmarks.length < 21) {
    return 0;
  }

  const palmWidth = distance(landmarks[5], landmarks[17]);
  const palmLength = distance(landmarks[0], landmarks[9]);
  return Math.max(palmWidth, palmLength);
}

export function detectPinch(landmarks: HandLandmark[], threshold = 0.05): boolean {
  if (landmarks.length < 21) {
    return false;
  }

  return distance(landmarks[4], landmarks[8]) < threshold;
}

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
