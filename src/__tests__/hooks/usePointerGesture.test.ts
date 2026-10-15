import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { IDLE_GESTURE, usePointerGesture } from "@/hooks/usePointerGesture";

let board: HTMLDivElement;

function fire(
  type: string,
  init: { x?: number; y?: number; pointerId?: number; button?: number; pointerType?: string } = {},
  target: Element = board,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperty(event, "pointerId", { value: init.pointerId ?? 1 });
  Object.defineProperty(event, "pointerType", { value: init.pointerType ?? "mouse" });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function render(enabled = true) {
  const ref = { current: board };
  return renderHook(({ on }: { on: boolean }) => usePointerGesture(ref, on), { initialProps: { on: enabled } });
}

describe("usePointerGesture", () => {
  beforeEach(() => {
    board = document.createElement("div");
    board.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    document.body.appendChild(board);
  });

  afterEach(() => {
    board.remove();
  });

  it("follows the pointer in board coordinates", () => {
    const { result } = render();
    fire("pointermove", { x: 110, y: 70 });
    expect(result.current).toMatchObject({ cursorX: 100, cursorY: 50, handDetected: true, isPinching: false });
  });

  it("treats a primary press as a pinch and the release as opening the hand", () => {
    const { result } = render();
    const down = fire("pointerdown", { x: 60, y: 60 });
    expect(down.defaultPrevented).toBe(true);
    expect(result.current).toMatchObject({ isPinching: true, pinchProgress: 1, cursorX: 50, cursorY: 40 });

    fire("pointermove", { x: 80, y: 90 });
    expect(result.current).toMatchObject({ cursorX: 70, cursorY: 70, isPinching: true });

    fire("pointerup");
    expect(result.current).toMatchObject({ isPinching: false, pinchProgress: 0, handDetected: true });
  });

  it("hides the cursor after a touch ends", () => {
    const { result } = render();
    fire("pointerdown", { pointerType: "touch" });
    fire("pointerup", { pointerType: "touch" });
    expect(result.current.handDetected).toBe(false);
  });

  it("ignores secondary buttons, other pointers and presses on form controls", () => {
    const textarea = document.createElement("textarea");
    board.appendChild(textarea);
    const { result } = render();

    fire("pointerdown", { button: 2 });
    fire("pointerdown", {}, textarea);
    expect(result.current.isPinching).toBe(false);

    fire("pointerdown", { pointerId: 1 });
    fire("pointermove", { x: 500, y: 500, pointerId: 2 });
    fire("pointerup", { pointerId: 2 });
    expect(result.current).toMatchObject({ isPinching: true, cursorX: -10 });
  });

  it("lets a note's drag handle start a drag even though it is a button", () => {
    const handle = document.createElement("button");
    handle.setAttribute("data-drag-handle", "");
    board.appendChild(handle);
    const { result } = render();
    fire("pointerdown", {}, handle);
    expect(result.current.isPinching).toBe(true);
  });

  it("loses the cursor when the pointer leaves without pressing", () => {
    const { result } = render();
    fire("pointermove", { x: 20, y: 30 });
    fire("pointerleave");
    expect(result.current.handDetected).toBe(false);

    fire("pointerdown");
    fire("pointerleave");
    expect(result.current.handDetected).toBe(true);
  });

  it("returns the idle gesture while disabled and resets when turned off", () => {
    const { result, rerender } = render(false);
    fire("pointerdown");
    expect(result.current).toEqual(IDLE_GESTURE);

    rerender({ on: true });
    fire("pointerdown");
    expect(result.current.isPinching).toBe(true);
    rerender({ on: false });
    expect(result.current).toEqual(IDLE_GESTURE);
  });
});
