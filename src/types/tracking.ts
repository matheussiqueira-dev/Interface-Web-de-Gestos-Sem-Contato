export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type HandTrackingStatus = "idle" | "loading" | "ready" | "error";

export interface HandTrackingState {
  landmarks: HandLandmark[] | null;
  status: HandTrackingStatus;
  error: string | null;
}
