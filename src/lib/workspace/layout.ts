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
    ? { width: 160, height: 128 }
    : { width: 232, height: 168 };
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
