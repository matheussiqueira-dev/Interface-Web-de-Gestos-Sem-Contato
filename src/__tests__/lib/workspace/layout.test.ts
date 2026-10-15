import { describe, expect, it } from "vitest";

import { BOARD_PADDING, clampNotePosition, findNoteAt, getNoteSize } from "@/lib/workspace/layout";

const wide = { width: 1000, height: 600 };
const narrow = { width: 340, height: 480 };

describe("getNoteSize", () => {
  it("uses compact notes on narrow boards", () => {
    expect(getNoteSize(narrow.width)).toEqual({ width: 148, height: 120 });
    expect(getNoteSize(wide.width)).toEqual({ width: 232, height: 168 });
  });
});

describe("clampNotePosition", () => {
  it("keeps notes inside the board padding", () => {
    expect(clampNotePosition({ x: -50, y: -50 }, wide)).toEqual({ x: BOARD_PADDING, y: BOARD_PADDING });
    expect(clampNotePosition({ x: 5000, y: 5000 }, wide)).toEqual({
      x: wide.width - 232 - BOARD_PADDING,
      y: wide.height - 168 - BOARD_PADDING,
    });
  });

  it("pins notes to the padding when the board is smaller than a note", () => {
    expect(clampNotePosition({ x: 100, y: 100 }, { width: 100, height: 80 })).toEqual({
      x: BOARD_PADDING,
      y: BOARD_PADDING,
    });
  });
});

describe("findNoteAt", () => {
  const notes = [
    { id: "below", x: 100, y: 100 },
    { id: "above", x: 150, y: 150 },
  ];

  it("returns the topmost note under the point with its rendered position", () => {
    expect(findNoteAt(notes, { x: 200, y: 200 }, wide)).toMatchObject({
      id: "above",
      renderX: 150,
      renderY: 150,
    });
    expect(findNoteAt(notes, { x: 110, y: 110 }, wide)?.id).toBe("below");
  });

  it("returns null over free space", () => {
    expect(findNoteAt(notes, { x: 900, y: 500 }, wide)).toBeNull();
  });

  it("hit-tests the clamped position on a narrow board", () => {
    // Stored at x=600 but drawn at the right edge of a 340px board
    const offBoard = [{ id: "off", x: 600, y: 20 }];
    const drawnX = narrow.width - 148 - BOARD_PADDING;
    expect(findNoteAt(offBoard, { x: drawnX + 10, y: 30 }, narrow)?.id).toBe("off");
  });
});
