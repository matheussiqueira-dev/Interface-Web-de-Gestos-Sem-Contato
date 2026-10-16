import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IDLE_GESTURE } from "@/hooks/usePointerGesture";
import { useNoteDrag } from "@/hooks/useNoteDrag";
import type { GestureState } from "@/types/gesture";
import type { WorkspaceNote } from "@/types/workspace";

const board = { width: 1000, height: 600 };

const note: WorkspaceNote = {
  id: "note-a",
  x: 100,
  y: 100,
  text: "Nota",
  color: "#6eb9ff",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function gesture(x: number, y: number, isPinching = false, handDetected = true): GestureState {
  return { ...IDLE_GESTURE, cursorX: x, cursorY: y, isPinching, handDetected };
}

function setup(initial: GestureState, enabled = true) {
  const dispatch = vi.fn();
  const hook = renderHook(
    ({ notes, current, active }: { notes: WorkspaceNote[]; current: GestureState; active: boolean }) =>
      useNoteDrag(notes, board, current, active, dispatch),
    { initialProps: { notes: [note], current: initial, active: enabled } },
  );
  return { ...hook, dispatch };
}

describe("useNoteDrag", () => {
  it("targets the note under an open hand", () => {
    const { result } = setup(gesture(150, 120));
    expect(result.current).toEqual({ draggingId: null, targetedId: "note-a" });
  });

  it("grabs the note on pinch, records one undo entry and moves it with the cursor", () => {
    const { result, rerender, dispatch } = setup(gesture(150, 120));

    rerender({ notes: [note], current: gesture(150, 120, true), active: true });
    expect(result.current.draggingId).toBe("note-a");
    expect(dispatch).toHaveBeenCalledWith({ type: "beginNoteDrag" });

    rerender({ notes: [note], current: gesture(400, 300, true), active: true });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "moveNote",
      payload: { id: "note-a", x: 350, y: 280 },
    });
    expect(dispatch.mock.calls.filter(([action]) => action.type === "beginNoteDrag")).toHaveLength(1);
  });

  it("drops the note when the pinch opens", () => {
    const { result, rerender } = setup(gesture(150, 120));
    rerender({ notes: [note], current: gesture(150, 120, true), active: true });
    rerender({ notes: [note], current: gesture(150, 120, false), active: true });
    expect(result.current.draggingId).toBeNull();
  });

  it("grabs nothing when the pinch starts on free space", () => {
    const { result, rerender, dispatch } = setup(gesture(800, 500));
    rerender({ notes: [note], current: gesture(800, 500, true), active: true });
    expect(result.current).toEqual({ draggingId: null, targetedId: null });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing while disabled or without a hand", () => {
    expect(setup(gesture(150, 120), false).result.current.targetedId).toBeNull();
    expect(setup(gesture(150, 120, false, false)).result.current.targetedId).toBeNull();
  });

  it("skips sub-pixel moves", () => {
    const { rerender, dispatch } = setup(gesture(150, 120));
    rerender({ notes: [note], current: gesture(150, 120, true), active: true });
    rerender({ notes: [note], current: gesture(150.2, 120.2, true), active: true });
    expect(dispatch.mock.calls.some(([action]) => action.type === "moveNote")).toBe(false);
  });
});
