// Hand tracking types
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingResult {
  landmarks: HandLandmark[];
  handedness: string;
}

// Gesture types
export type GestureType = 'none' | 'pinch' | 'fist' | 'open';

export interface GestureState {
  type: GestureType;
  confidence: number;
  position: { x: number; y: number };
  isStable: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
}

// Note types
export interface Note {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
}

// Drawing types
export interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  width: number;
}
