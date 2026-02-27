import type { WorkspaceSettings, WorkspaceSnapshot } from "@/types/workspace";

export const NOTE_COLORS = ["#fef3c7", "#d9f99d", "#bfdbfe", "#fecaca", "#fde68a"];

export const DRAW_COLORS = [
  { label: "Turquesa", value: "#2dd4bf" },
  { label: "Ciano", value: "#22d3ee" },
  { label: "Laranja", value: "#fb923c" },
  { label: "Rosa", value: "#f472b6" },
  { label: "Lima", value: "#a3e635" },
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
    color: "#fef3c7",
    text: "Use pinça para mover as notas pela mesa.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "draw-note",
    x: 420,
    y: 220,
    color: "#d9f99d",
    text: "Pinça no espaço vazio para desenhar.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "pause-note",
    x: 220,
    y: 430,
    color: "#bfdbfe",
    text: "Punho fechado pausa o tracking por segurança.",
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
