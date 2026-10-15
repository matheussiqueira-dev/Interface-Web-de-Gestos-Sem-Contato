export type CameraStatus = "requesting" | "active" | "error";

export type CameraErrorKind = "denied" | "not-found" | "busy" | "unsupported" | "unknown";

export interface CameraError {
  kind: CameraErrorKind;
  message: string;
}

export interface CameraSetupOptions {
  width?: number;
  height?: number;
  frameRate?: number;
  facingMode?: "user" | "environment";
}
