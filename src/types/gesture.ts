export interface GestureState {
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  isFist: boolean;
  handDetected: boolean;
  swipeDirection: SwipeDirection | null;
  gestureConfidence: number;
  /**
   * How close the thumb-index gap is to the active pinch threshold:
   * threshold / gap, clamped to [0, 1]. 1 means the gap is at or inside the threshold.
   * The threshold already includes hysteresis, so it is larger while pinching.
   */
  pinchProgress: number;
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
