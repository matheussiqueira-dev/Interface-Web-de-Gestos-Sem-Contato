"use client";

import { Move, Trash2 } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";

import { clampNotePosition, getNoteSize, type Size } from "@/lib/workspace/layout";
import { NOTE_TEXT_MAX_LENGTH } from "@/lib/workspace/schema";
import type { WorkspaceNote } from "@/types/workspace";

const NUDGE_STEP = 8;
const NUDGE_STEP_LARGE = 32;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface NotesBoardProps {
  notes: readonly WorkspaceNote[];
  board: Size;
  draggingId: string | null;
  targetedId: string | null;
  onTextChange: (noteId: string, text: string) => void;
  onDelete: (noteId: string) => void;
  onNudge: (noteId: string, dx: number, dy: number) => void;
}

/**
 * The notes layer. Hands and pointers move notes through useNoteDrag; this
 * component renders them and gives every note a keyboard path: arrow keys on
 * the handle move it, the text field edits it, the trash button removes it.
 */
export function NotesBoard({
  notes,
  board,
  draggingId,
  targetedId,
  onTextChange,
  onDelete,
  onNudge,
}: NotesBoardProps) {
  const size = getNoteSize(board.width);

  const handleKeyDown = (noteId: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = ARROWS[event.key];
    if (!direction) {
      return;
    }
    event.preventDefault();
    const step = event.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    onNudge(noteId, direction[0] * step, direction[1] * step);
  };

  return (
    <div className="board__notes">
      <p id="note-move-help" className="ms-sr-only">
        Use as setas para mover a nota; com Shift, o passo é maior.
      </p>
      {notes.map((note, index) => {
        const position = clampNotePosition(note, board);
        const state = note.id === draggingId ? "dragging" : note.id === targetedId ? "targeted" : undefined;

        return (
          <article
            key={note.id}
            className="note"
            data-state={state}
            aria-label={`Nota ${index + 1}`}
            style={
              {
                width: size.width,
                height: size.height,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                "--note-color": note.color,
              } as CSSProperties
            }
          >
            <div className="note__bar">
              <button
                type="button"
                className="note__handle ms-focus-inset"
                data-drag-handle
                aria-label={`Mover nota ${index + 1}`}
                aria-describedby="note-move-help"
                onKeyDown={handleKeyDown(note.id)}
              >
                <Move size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="note__delete ms-focus-inset"
                aria-label={`Excluir nota ${index + 1}`}
                onClick={() => onDelete(note.id)}
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <label className="ms-sr-only" htmlFor={`note-text-${note.id}`}>
              Texto da nota {index + 1}
            </label>
            <textarea
              id={`note-text-${note.id}`}
              className="note__text"
              value={note.text}
              maxLength={NOTE_TEXT_MAX_LENGTH}
              onChange={(event) => onTextChange(note.id, event.target.value)}
            />
          </article>
        );
      })}
    </div>
  );
}
