export interface GestureState {
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  isFist: boolean;
  handDetected: boolean;
  swipeDirection: SwipeDirection | null;
  gestureConfidence: number;
}

export interface GestureEngineOptions {
  pinchSensitivity?: number;
  cursorResponsiveness?: number;
}

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeVector {
  direction: SwipeDirection;
  velocity: number;
}
