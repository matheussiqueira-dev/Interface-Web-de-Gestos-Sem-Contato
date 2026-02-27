export interface WorkspaceNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  drawingColor: string;
  pinchSensitivity: number;
  cursorResponsiveness: number;
  particlesEnabled: boolean;
}

export interface WorkspaceSnapshot {
  notes: WorkspaceNote[];
  settings: WorkspaceSettings;
  updatedAt: string;
}

export type WorkspaceEventType =
  | "workspace_loaded"
  | "workspace_saved"
  | "tracking_paused"
  | "tracking_resumed"
  | "camera_error";
