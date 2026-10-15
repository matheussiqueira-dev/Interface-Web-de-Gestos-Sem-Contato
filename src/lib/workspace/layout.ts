export interface Size {
  width: number;
  height: number;
}

export const BOARD_PADDING = 16;
const COMPACT_BOARD_WIDTH = 600;

/**
 * Note dimensions for a board width. Narrow boards (phones) use smaller notes
 * so at least two fit side by side.
 */
export function getNoteSize(boardWidth: number): Size {
  return boardWidth < COMPACT_BOARD_WIDTH
    ? { width: 148, height: 120 }
    : { width: 232, height: 168 };
}

interface Positioned {
  id: string;
  x: number;
  y: number;
}

/**
 * Returns the topmost note under a point (later notes render above earlier
 * ones), using the clamped position the note is actually drawn at.
 */
export function findNoteAt<T extends Positioned>(
  notes: readonly T[],
  point: { x: number; y: number },
  board: Size,
): (T & { renderX: number; renderY: number }) | null {
  const size = getNoteSize(board.width);
  for (let index = notes.length - 1; index >= 0; index--) {
    const note = notes[index];
    const position = clampNotePosition(note, board);
    if (
      point.x >= position.x &&
      point.x <= position.x + size.width &&
      point.y >= position.y &&
      point.y <= position.y + size.height
    ) {
      return { ...note, renderX: position.x, renderY: position.y };
    }
  }
  return null;
}

/**
 * Keeps a note's top-left corner inside the board.
 */
export function clampNotePosition(
  position: { x: number; y: number },
  board: Size,
): { x: number; y: number } {
  const note = getNoteSize(board.width);
  const maxX = Math.max(BOARD_PADDING, board.width - note.width - BOARD_PADDING);
  const maxY = Math.max(BOARD_PADDING, board.height - note.height - BOARD_PADDING);
  return {
    x: Math.min(Math.max(position.x, BOARD_PADDING), maxX),
    y: Math.min(Math.max(position.y, BOARD_PADDING), maxY),
  };
}
