export type CameraPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export interface CameraSetupOptions {
  width?: number;
  height?: number;
  frameRate?: number;
  facingMode?: "user" | "environment";
}
