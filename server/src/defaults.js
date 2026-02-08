export const DEFAULT_SETTINGS = {
  drawingColor: "#2dd4bf",
  pinchSensitivity: 1,
  cursorResponsiveness: 1,
  particlesEnabled: true,
};

export const DEFAULT_NOTES = [
  {
    id: "welcome-note",
    x: 96,
    y: 140,
    color: "#fef3c7",
    text: "Use o gesto de pinça para mover esta nota.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "draw-note",
    x: 420,
    y: 220,
    color: "#d9f99d",
    text: "Pinça no espaço vazio para desenhar no canvas.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "pause-note",
    x: 220,
    y: 430,
    color: "#bfdbfe",
    text: "Feche o punho para pausar temporariamente.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function createDefaultWorkspace() {
  return {
    notes: DEFAULT_NOTES.map((note) => ({ ...note })),
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
}
