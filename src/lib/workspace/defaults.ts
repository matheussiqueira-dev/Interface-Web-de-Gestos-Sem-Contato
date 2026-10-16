import type { WorkspaceNote, WorkspaceSettings, WorkspaceSnapshot } from "@/types/workspace";

/**
 * Categorical colours for notes and strokes. Values mirror --ms-chart-1..6 in
 * src/app/ms-tokens.css (a test keeps them in sync); they are stored as hex
 * because saved workspaces must stay readable without the stylesheet.
 */
export const BOARD_COLORS = [
  { label: "Azul", value: "#6eb9ff", token: "--ms-chart-1" },
  { label: "Pêssego", value: "#f8ba8a", token: "--ms-chart-2" },
  { label: "Índigo", value: "#886fe2", token: "--ms-chart-3" },
  { label: "Malva", value: "#cb83ab", token: "--ms-chart-4" },
  { label: "Mostarda", value: "#cbbb2d", token: "--ms-chart-5" },
  { label: "Jade", value: "#38b693", token: "--ms-chart-6" },
] as const;

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  drawingColor: BOARD_COLORS[0].value,
  pinchSensitivity: 1,
  cursorResponsiveness: 1,
  particlesEnabled: false,
};

const SEED_DATE = "2026-01-01T00:00:00.000Z";

const DEFAULT_NOTES: readonly WorkspaceNote[] = [
  {
    id: "welcome-note",
    x: 24,
    y: 24,
    color: BOARD_COLORS[0].value,
    text: "Aponte o indicador para mover o cursor. Junte polegar e indicador sobre esta nota para arrastá-la.",
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: "draw-note",
    x: 300,
    y: 120,
    color: BOARD_COLORS[1].value,
    text: "Faça a pinça num espaço vazio do quadro para desenhar.",
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: "pause-note",
    x: 120,
    y: 300,
    color: BOARD_COLORS[5].value,
    text: "Com o punho fechado, o desenho fica pausado.",
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
];

export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    notes: DEFAULT_NOTES.map((note) => ({ ...note })),
    settings: { ...DEFAULT_WORKSPACE_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
}
