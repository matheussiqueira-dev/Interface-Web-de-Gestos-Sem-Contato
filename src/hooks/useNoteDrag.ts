"use client";

import { type Dispatch, useEffect, useRef, useState } from "react";

import { clampNotePosition, findNoteAt, type Size } from "@/lib/workspace/layout";
import type { WorkspaceAction } from "@/lib/workspace/reducer";
import type { GestureState } from "@/types/gesture";
import type { WorkspaceNote } from "@/types/workspace";

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface NoteDragResult {
  /** Note being dragged by the current pinch, if any. */
  draggingId: string | null;
  /** Note under the cursor while the hand is open: what a pinch would grab. */
  targetedId: string | null;
}

/**
 * Turns pinch transitions into note drags. A pinch that starts over a note
 * grabs it (one undo entry); moving the cursor moves it; releasing drops it.
 * A pinch that starts on free space grabs nothing, so the board draws instead.
 */
export function useNoteDrag(
  notes: readonly WorkspaceNote[],
  board: Size,
  gesture: GestureState,
  enabled: boolean,
  dispatch: Dispatch<WorkspaceAction>,
): NoteDragResult {
  const pinching = enabled && gesture.handDetected && gesture.isPinching;
  const [drag, setDrag] = useState<DragState | null>(null);
  const [wasPinching, setWasPinching] = useState(pinching);

  // Derive the drag from the pinch edge during render (no effect round-trip).
  if (pinching !== wasPinching) {
    setWasPinching(pinching);
    if (pinching) {
      const hit = findNoteAt(notes, { x: gesture.cursorX, y: gesture.cursorY }, board);
      setDrag(
        hit
          ? { id: hit.id, offsetX: gesture.cursorX - hit.renderX, offsetY: gesture.cursorY - hit.renderY }
          : null,
      );
    } else {
      setDrag(null);
    }
  }

  const startedDragRef = useRef<string | null>(null);

  useEffect(() => {
    if (!drag) {
      startedDragRef.current = null;
      return;
    }

    if (startedDragRef.current !== drag.id) {
      startedDragRef.current = drag.id;
      dispatch({ type: "beginNoteDrag" });
    }

    const note = notes.find((item) => item.id === drag.id);
    if (!note) {
      return;
    }

    const next = clampNotePosition(
      { x: gesture.cursorX - drag.offsetX, y: gesture.cursorY - drag.offsetY },
      board,
    );
    if (Math.abs(next.x - note.x) < 0.5 && Math.abs(next.y - note.y) < 0.5) {
      return;
    }

    dispatch({ type: "moveNote", payload: { id: drag.id, ...next } });
  }, [board, dispatch, drag, gesture.cursorX, gesture.cursorY, notes]);

  const targeted =
    !drag && enabled && gesture.handDetected
      ? findNoteAt(notes, { x: gesture.cursorX, y: gesture.cursorY }, board)
      : null;

  return { draggingId: drag?.id ?? null, targetedId: targeted?.id ?? null };
}
