import { describe, expect, it } from "vitest";

import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState,
} from "@/lib/workspace/reducer";
import type { WorkspaceNote, WorkspaceSettings } from "@/types/workspace";

function makeNote(overrides: Partial<WorkspaceNote> = {}): WorkspaceNote {
  return {
    id: "note-1",
    x: 100,
    y: 200,
    text: "Test note",
    color: "#00E5FF",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<WorkspaceSettings> = {}): WorkspaceSettings {
  return {
    drawingColor: "#00E5FF",
    pinchSensitivity: 1,
    cursorResponsiveness: 1,
    particlesEnabled: true,
    ...overrides,
  };
}

describe("createInitialWorkspaceState", () => {
  it("returns tracking enabled by default", () => {
    const state = createInitialWorkspaceState();
    expect(state.trackingEnabled).toBe(true);
  });

  it("returns clearSignal at 0", () => {
    const state = createInitialWorkspaceState();
    expect(state.clearSignal).toBe(0);
  });

  it("returns a snapshot with notes array", () => {
    const state = createInitialWorkspaceState();
    expect(Array.isArray(state.snapshot.notes)).toBe(true);
  });

  it("returns a snapshot with settings", () => {
    const state = createInitialWorkspaceState();
    expect(state.snapshot.settings).toBeDefined();
  });
});

describe("workspaceReducer", () => {
  let state: WorkspaceState;

  function dispatch(state: WorkspaceState, action: Parameters<typeof workspaceReducer>[1]): WorkspaceState {
    return workspaceReducer(state, action);
  }

  state = createInitialWorkspaceState();

  describe("hydrate", () => {
    it("replaces snapshot with payload", () => {
      const note = makeNote();
      const newSnapshot = {
        notes: [note],
        settings: makeSettings(),
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      const next = dispatch(state, { type: "hydrate", payload: newSnapshot });
      expect(next.snapshot.notes).toHaveLength(1);
      expect(next.snapshot.notes[0].id).toBe("note-1");
    });

    it("updates the updatedAt timestamp", () => {
      const snapshot = {
        notes: [],
        settings: makeSettings(),
        updatedAt: "2000-01-01T00:00:00.000Z",
      };
      const next = dispatch(state, { type: "hydrate", payload: snapshot });
      expect(next.snapshot.updatedAt).not.toBe("2000-01-01T00:00:00.000Z");
    });
  });

  describe("addNote", () => {
    it("appends note to the notes array", () => {
      const note = makeNote({ id: "new-note" });
      const next = dispatch(state, { type: "addNote", payload: note });
      const added = next.snapshot.notes.find((n) => n.id === "new-note");
      expect(added).toBeDefined();
    });

    it("does not mutate original state notes array", () => {
      const original = state.snapshot.notes.length;
      const note = makeNote({ id: "immutable-test" });
      dispatch(state, { type: "addNote", payload: note });
      expect(state.snapshot.notes).toHaveLength(original);
    });
  });

  describe("removeNote", () => {
    it("removes note with matching id", () => {
      const note = makeNote({ id: "to-remove" });
      const withNote = dispatch(state, { type: "addNote", payload: note });
      const next = dispatch(withNote, { type: "removeNote", payload: "to-remove" });
      const removed = next.snapshot.notes.find((n) => n.id === "to-remove");
      expect(removed).toBeUndefined();
    });

    it("does nothing when id not found", () => {
      const count = state.snapshot.notes.length;
      const next = dispatch(state, { type: "removeNote", payload: "non-existent-id" });
      expect(next.snapshot.notes).toHaveLength(count);
    });
  });

  describe("setNotes", () => {
    it("replaces all notes with payload", () => {
      const newNotes = [makeNote({ id: "a" }), makeNote({ id: "b" })];
      const next = dispatch(state, { type: "setNotes", payload: newNotes });
      expect(next.snapshot.notes).toHaveLength(2);
      expect(next.snapshot.notes[0].id).toBe("a");
    });
  });

  describe("setSettings", () => {
    it("replaces settings entirely", () => {
      const settings = makeSettings({ drawingColor: "#FF0000", particlesEnabled: false });
      const next = dispatch(state, { type: "setSettings", payload: settings });
      expect(next.snapshot.settings.drawingColor).toBe("#FF0000");
      expect(next.snapshot.settings.particlesEnabled).toBe(false);
    });
  });

  describe("patchSettings", () => {
    it("merges partial settings into existing settings", () => {
      const next = dispatch(state, {
        type: "patchSettings",
        payload: { particlesEnabled: false },
      });
      expect(next.snapshot.settings.particlesEnabled).toBe(false);
      expect(next.snapshot.settings.drawingColor).toBe(
        state.snapshot.settings.drawingColor,
      );
    });
  });

  describe("toggleTracking", () => {
    it("toggles tracking from true to false", () => {
      const enabledState = { ...state, trackingEnabled: true };
      const next = dispatch(enabledState, { type: "toggleTracking" });
      expect(next.trackingEnabled).toBe(false);
    });

    it("toggles tracking from false to true", () => {
      const disabledState = { ...state, trackingEnabled: false };
      const next = dispatch(disabledState, { type: "toggleTracking" });
      expect(next.trackingEnabled).toBe(true);
    });
  });

  describe("setTracking", () => {
    it("sets tracking to explicit value", () => {
      const next = dispatch(state, { type: "setTracking", payload: false });
      expect(next.trackingEnabled).toBe(false);
    });
  });

  describe("clearDrawing", () => {
    it("increments clearSignal by 1", () => {
      const next = dispatch(state, { type: "clearDrawing" });
      expect(next.clearSignal).toBe(state.clearSignal + 1);
    });

    it("does not affect snapshot", () => {
      const next = dispatch(state, { type: "clearDrawing" });
      expect(next.snapshot).toEqual(state.snapshot);
    });
  });

  describe("resetWorkspace", () => {
    it("restores default notes", () => {
      const withNote = dispatch(state, { type: "addNote", payload: makeNote({ id: "extra" }) });
      const reset = dispatch(withNote, { type: "resetWorkspace" });
      const hasExtra = reset.snapshot.notes.find((n) => n.id === "extra");
      expect(hasExtra).toBeUndefined();
    });

    it("increments clearSignal", () => {
      const next = dispatch(state, { type: "resetWorkspace" });
      expect(next.clearSignal).toBeGreaterThan(state.clearSignal);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged for unknown action type", () => {
      // @ts-expect-error intentionally testing unknown action
      const next = dispatch(state, { type: "unknown_action" });
      expect(next).toBe(state);
    });
  });
});
