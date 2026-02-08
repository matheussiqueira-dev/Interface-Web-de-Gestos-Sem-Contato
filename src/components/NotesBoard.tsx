import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";

import type { WorkspaceNote } from "../domain/workspace";
import { clamp } from "../utils/geometry";

interface NotesBoardProps {
  notes: WorkspaceNote[];
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  trackingEnabled: boolean;
  width: number;
  height: number;
  onChange: (notes: WorkspaceNote[]) => void;
  onDeleteNote: (noteId: string) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string | null) => void;
}

const NOTE_WIDTH = 248;
const NOTE_HEIGHT = 190;
const BOARD_PADDING = 24;

export function NotesBoard({
  notes,
  cursorX,
  cursorY,
  isPinching,
  trackingEnabled,
  width,
  height,
  onChange,
  onDeleteNote,
  selectedNoteId,
  onSelectNote,
}: NotesBoardProps) {
  const notesRef = useRef(notes);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const bounds = useMemo(
    () => ({
      minX: BOARD_PADDING,
      minY: BOARD_PADDING,
      maxX: Math.max(BOARD_PADDING, width - NOTE_WIDTH - BOARD_PADDING),
      maxY: Math.max(BOARD_PADDING, height - NOTE_HEIGHT - BOARD_PADDING),
    }),
    [width, height],
  );

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    if (!trackingEnabled || !isPinching) {
      setDraggingId(null);
      return;
    }

    if (draggingId) {
      const nextNotes = notesRef.current.map((note) => {
        if (note.id !== draggingId) return note;

        const nextX = clamp(cursorX - dragOffsetRef.current.x, bounds.minX, bounds.maxX);
        const nextY = clamp(cursorY - dragOffsetRef.current.y, bounds.minY, bounds.maxY);
        if (Math.abs(nextX - note.x) < 0.2 && Math.abs(nextY - note.y) < 0.2) {
          return note;
        }

        return {
          ...note,
          x: nextX,
          y: nextY,
          updatedAt: new Date().toISOString(),
        };
      });

      onChange(nextNotes);
      return;
    }

    const hitNote = [...notesRef.current]
      .reverse()
      .find(
        (note) =>
          cursorX >= note.x &&
          cursorX <= note.x + NOTE_WIDTH &&
          cursorY >= note.y &&
          cursorY <= note.y + NOTE_HEIGHT,
      );

    if (hitNote) {
      setDraggingId(hitNote.id);
      onSelectNote(hitNote.id);
      dragOffsetRef.current = {
        x: cursorX - hitNote.x,
        y: cursorY - hitNote.y,
      };
    }
  }, [
    bounds.maxX,
    bounds.maxY,
    bounds.minX,
    bounds.minY,
    cursorX,
    cursorY,
    draggingId,
    isPinching,
    onChange,
    onSelectNote,
    trackingEnabled,
  ]);

  function handleNoteTextChange(noteId: string, text: string) {
    const nextNotes = notesRef.current.map((note) => {
      if (note.id !== noteId) return note;
      return {
        ...note,
        text,
        updatedAt: new Date().toISOString(),
      };
    });

    onChange(nextNotes);
  }

  return (
    <div className="notes-board" aria-label="Quadro de notas">
      <AnimatePresence>
        {notes.map((note) => {
          const selected = note.id === selectedNoteId;
          const dragging = draggingId === note.id;

          return (
            <motion.article
              key={note.id}
              className="note-card"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: 1,
                scale: dragging ? 1.04 : selected ? 1.02 : 1,
                x: note.x,
                y: note.y,
                boxShadow: dragging
                  ? "0 24px 38px rgba(15, 23, 42, 0.38)"
                  : selected
                    ? "0 16px 30px rgba(15, 23, 42, 0.28)"
                    : "0 10px 18px rgba(15, 23, 42, 0.18)",
              }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 30,
                x: { duration: 0.06 },
                y: { duration: 0.06 },
              }}
              style={{
                backgroundColor: note.color,
                left: 0,
                top: 0,
                position: "absolute",
                zIndex: selected || dragging ? 35 : 20,
              }}
              onPointerDown={() => onSelectNote(note.id)}
              role="group"
              aria-label={`Nota ${note.id}`}
            >
              <header className="note-header">
                <span className="note-drag-hint">
                  <GripVertical size={14} />
                  Pinça para mover
                </span>
                <button
                  className="note-delete-btn"
                  type="button"
                  aria-label="Excluir nota"
                  onClick={() => onDeleteNote(note.id)}
                >
                  <Trash2 size={14} />
                </button>
              </header>

              <textarea
                className="note-textarea"
                value={note.text}
                onFocus={() => onSelectNote(note.id)}
                onChange={(event) => handleNoteTextChange(note.id, event.target.value)}
                maxLength={320}
                aria-label="Texto da nota"
              />
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
