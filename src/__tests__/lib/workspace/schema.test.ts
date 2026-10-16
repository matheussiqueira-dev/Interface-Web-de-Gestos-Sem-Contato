import { describe, expect, it } from "vitest";

import { createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";
import {
  eventSchema,
  NOTE_TEXT_MAX_LENGTH,
  noteSchema,
  sanitizeNoteText,
  settingsSchema,
  workspaceSchema,
} from "@/lib/workspace/schema";

const validNote = {
  id: "note-1",
  x: 10,
  y: 20,
  text: "Revisar quadro",
  color: "#6eb9ff",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};

describe("noteSchema", () => {
  it("accepts a valid note and trims text", () => {
    expect(noteSchema.parse({ ...validNote, text: "  Olá  " }).text).toBe("Olá");
  });

  it.each([
    ["markup", "<b>x</b>"],
    ["whitespace only", "   "],
    ["too long", "a".repeat(NOTE_TEXT_MAX_LENGTH + 1)],
  ])("rejects %s text", (_label, text) => {
    expect(noteSchema.safeParse({ ...validNote, text }).success).toBe(false);
  });

  it("rejects invalid ids, colors and coordinates", () => {
    expect(noteSchema.safeParse({ ...validNote, id: "x" }).success).toBe(false);
    expect(noteSchema.safeParse({ ...validNote, color: "blue" }).success).toBe(false);
    expect(noteSchema.safeParse({ ...validNote, x: -1 }).success).toBe(false);
  });
});

describe("sanitizeNoteText", () => {
  it("leaves accepted text untouched", () => {
    expect(sanitizeNoteText("Reunião às 10h, sala 2.")).toEqual({
      text: "Reunião às 10h, sala 2.",
      changed: false,
    });
  });

  it("removes characters the schema rejects and reports the change", () => {
    const result = sanitizeNoteText('Ver (anexo) "final"; <ok>');
    expect(result).toEqual({ text: "Ver anexo final ok", changed: true });
    expect(noteSchema.safeParse({ ...validNote, text: result.text }).success).toBe(true);
  });

  it("caps the length", () => {
    expect(sanitizeNoteText("a".repeat(400)).text).toHaveLength(NOTE_TEXT_MAX_LENGTH);
  });
});

describe("settingsSchema", () => {
  it("enforces the slider ranges", () => {
    const settings = createDefaultWorkspaceSnapshot().settings;
    expect(settingsSchema.safeParse(settings).success).toBe(true);
    expect(settingsSchema.safeParse({ ...settings, pinchSensitivity: 2 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...settings, cursorResponsiveness: 0.1 }).success).toBe(false);
  });
});

describe("workspaceSchema", () => {
  it("accepts the default workspace", () => {
    expect(workspaceSchema.safeParse(createDefaultWorkspaceSnapshot()).success).toBe(true);
  });

  it("rejects duplicate note ids and unknown keys", () => {
    const snapshot = createDefaultWorkspaceSnapshot();
    expect(
      workspaceSchema.safeParse({ ...snapshot, notes: [validNote, validNote] }).success,
    ).toBe(false);
    expect(workspaceSchema.safeParse({ ...snapshot, extra: true }).success).toBe(false);
  });
});

describe("eventSchema", () => {
  it("defaults the payload and limits its keys", () => {
    const event = { type: "workspace_saved", occurredAt: "2026-10-01T10:00:00.000Z" };
    expect(eventSchema.parse(event).payload).toEqual({});
    expect(eventSchema.safeParse({ ...event, payload: { "bad key": 1 } }).success).toBe(false);
    const tooMany = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`k${i}`, i]));
    expect(eventSchema.safeParse({ ...event, payload: tooMany }).success).toBe(false);
  });
});
