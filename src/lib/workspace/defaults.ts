import type { WorkspaceSettings, WorkspaceSnapshot } from "@/types/workspace";

export const NOTE_COLORS = ["#00E5FF", "#33F3FF", "#00B8D9", "#6CF7FF", "#0FF1FF"];

export const DRAW_COLORS = [
  { label: "Neon Blue", value: "#00E5FF" },
  { label: "Secondary Blue", value: "#00B8D9" },
  { label: "Accent Cyan", value: "#33F3FF" },
  { label: "Glow Core", value: "#00FFFF" },
  { label: "Ice Signal", value: "#6CF7FF" },
] as const;

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  drawingColor: DRAW_COLORS[0].value,
  pinchSensitivity: 1,
  cursorResponsiveness: 1,
  particlesEnabled: true,
};

const DEFAULT_NOTES = [
  {
    id: "welcome-note",
    x: 96,
    y: 140,
    color: "#00E5FF",
    text: "Use pinca para deslocar paineis pelo grid.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "draw-note",
    x: 420,
    y: 220,
    color: "#33F3FF",
    text: "Pinca no espaco livre para desenhar trilhas de luz.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "pause-note",
    x: 220,
    y: 430,
    color: "#00B8D9",
    text: "Punho fechado interrompe o tracking por seguranca.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
] as const;

export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    notes: DEFAULT_NOTES.map((note) => ({ ...note })),
    settings: { ...DEFAULT_WORKSPACE_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
}
