import { describe, expect, it } from "vitest";

import {
  canRedo,
  canUndo,
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState,
} from "@/lib/workspace/reducer";
import type { WorkspaceNote } from "@/types/workspace";

function makeNote(id: string): WorkspaceNote {
  return {
    id,
    x: 0,
    y: 0,
    text: `Note ${id}`,
    color: "#00E5FF",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function dispatch(state: WorkspaceState, action: Parameters<typeof workspaceReducer>[1]) {
  return workspaceReducer(state, action);
}

describe("undo/redo", () => {
  describe("canUndo / canRedo selectors", () => {
    it("canUndo returns false on initial state", () => {
      expect(canUndo(createInitialWorkspaceState())).toBe(false);
    });

    it("canRedo returns false on initial state", () => {
      expect(canRedo(createInitialWorkspaceState())).toBe(false);
    });

    it("canUndo returns true after a mutation", () => {
      let state = createInitialWorkspaceState();
      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      expect(canUndo(state)).toBe(true);
    });

    it("canRedo returns true after undo", () => {
      let state = createInitialWorkspaceState();
      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      state = dispatch(state, { type: "undo" });
      expect(canRedo(state)).toBe(true);
    });
  });

  describe("undo action", () => {
    it("restores previous snapshot", () => {
      let state = createInitialWorkspaceState();
      const originalCount = state.snapshot.notes.length;

      state = dispatch(state, { type: "addNote", payload: makeNote("x") });
      expect(state.snapshot.notes.length).toBe(originalCount + 1);

      state = dispatch(state, { type: "undo" });
      expect(state.snapshot.notes.length).toBe(originalCount);
    });

    it("is a no-op when history is empty", () => {
      const state = createInitialWorkspaceState();
      const next = dispatch(state, { type: "undo" });
      expect(next).toBe(state);
    });

    it("pushes current snapshot to future on undo", () => {
      let state = createInitialWorkspaceState();
      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      const snapshotBeforeUndo = state.snapshot;

      state = dispatch(state, { type: "undo" });
      expect(state.future[0]).toEqual(snapshotBeforeUndo);
    });

    it("supports multiple undo steps", () => {
      let state = createInitialWorkspaceState();
      const start = state.snapshot.notes.length;

      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      state = dispatch(state, { type: "addNote", payload: makeNote("b") });
      state = dispatch(state, { type: "undo" });
      state = dispatch(state, { type: "undo" });

      expect(state.snapshot.notes.length).toBe(start);
      expect(state.future.length).toBe(2);
    });
  });

  describe("redo action", () => {
    it("re-applies undone snapshot", () => {
      let state = createInitialWorkspaceState();
      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      const countAfterAdd = state.snapshot.notes.length;

      state = dispatch(state, { type: "undo" });
      state = dispatch(state, { type: "redo" });

      expect(state.snapshot.notes.length).toBe(countAfterAdd);
    });

    it("is a no-op when future is empty", () => {
      const state = createInitialWorkspaceState();
      const next = dispatch(state, { type: "redo" });
      expect(next).toBe(state);
    });

    it("clears future when a new mutation is applied after undo", () => {
      let state = createInitialWorkspaceState();
      state = dispatch(state, { type: "addNote", payload: makeNote("a") });
      state = dispatch(state, { type: "undo" });
      expect(canRedo(state)).toBe(true);

      state = dispatch(state, { type: "addNote", payload: makeNote("b") });
      expect(canRedo(state)).toBe(false);
    });

    it("supports undo then redo then undo again", () => {
      let state = createInitialWorkspaceState();
      const initial = state.snapshot.notes.length;

      state = dispatch(state, { type: "addNote", payload: makeNote("x") });
      const after = state.snapshot.notes.length;

      state = dispatch(state, { type: "undo" });
      expect(state.snapshot.notes.length).toBe(initial);

      state = dispatch(state, { type: "redo" });
      expect(state.snapshot.notes.length).toBe(after);

      state = dispatch(state, { type: "undo" });
      expect(state.snapshot.notes.length).toBe(initial);
    });
  });
});
