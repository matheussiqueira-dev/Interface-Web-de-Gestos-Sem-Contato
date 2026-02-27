export interface GestureState {
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  isFist: boolean;
  handDetected: boolean;
}

export interface GestureEngineOptions {
  pinchSensitivity?: number;
  cursorResponsiveness?: number;
}
