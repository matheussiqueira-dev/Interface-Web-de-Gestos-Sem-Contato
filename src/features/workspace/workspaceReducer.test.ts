import { describe, expect, it } from "vitest";

import { createDefaultWorkspaceSnapshot } from "../../domain/workspace";
import {
  createInitialWorkspaceState,
  workspaceReducer,
} from "./workspaceReducer";

describe("workspaceReducer", () => {
  it("hydrates snapshot from persistence", () => {
    const initialState = createInitialWorkspaceState();
    const hydratedSnapshot = createDefaultWorkspaceSnapshot();
    hydratedSnapshot.settings.particlesEnabled = false;

    const nextState = workspaceReducer(initialState, {
      type: "hydrate",
      payload: hydratedSnapshot,
    });

    expect(nextState.snapshot.settings.particlesEnabled).toBe(false);
  });

  it("adds and removes notes", () => {
    const initialState = createInitialWorkspaceState();
    const note = {
      id: "note-test",
      x: 200,
      y: 220,
      color: "#fef3c7",
      text: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const withNote = workspaceReducer(initialState, { type: "addNote", payload: note });
    expect(withNote.snapshot.notes.some((item) => item.id === "note-test")).toBe(true);

    const withoutNote = workspaceReducer(withNote, {
      type: "removeNote",
      payload: "note-test",
    });
    expect(withoutNote.snapshot.notes.some((item) => item.id === "note-test")).toBe(
      false,
    );
  });

  it("increments clear signal when clearing drawing", () => {
    const initialState = createInitialWorkspaceState();
    const nextState = workspaceReducer(initialState, { type: "clearDrawing" });

    expect(nextState.clearSignal).toBe(initialState.clearSignal + 1);
  });
});
