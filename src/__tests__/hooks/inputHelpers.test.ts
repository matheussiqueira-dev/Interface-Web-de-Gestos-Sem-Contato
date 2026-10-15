import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGestureCalibration } from "@/hooks/useGestureCalibration";
import { formatShortcut, type KeyBinding, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { buildHandLandmarks } from "@/lib/demo/simulatedHand";

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("useKeyboardShortcuts", () => {
  it("runs the matching binding and prevents the default action", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const bindings: KeyBinding[] = [
      { key: "z", modifiers: ["ctrl"], description: "Desfazer", handler: undo },
      { key: "z", modifiers: ["ctrl", "shift"], description: "Refazer", handler: redo },
    ];
    renderHook(() => useKeyboardShortcuts(bindings));

    expect(press("Z", { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(undo).toHaveBeenCalledOnce();

    press("z", { ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();

    press("z");
    press("z", { ctrlKey: true, altKey: true });
    press("z", { ctrlKey: true, metaKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });

  it("ignores keys typed into text fields", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "n", description: "Nova nota", handler }]));
    const input = document.createElement("input");
    document.body.appendChild(input);
    press("n", {}, input);
    expect(handler).not.toHaveBeenCalled();
    press("n");
    expect(handler).toHaveBeenCalledOnce();
    input.remove();
  });

  it("registers nothing when disabled or empty, and cleans up on unmount", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "n", description: "x", handler }], false));
    renderHook(() => useKeyboardShortcuts([]));
    const mounted = renderHook(() => useKeyboardShortcuts([{ key: "m", description: "x", handler }]));
    mounted.unmount();
    press("n");
    press("m");
    expect(handler).not.toHaveBeenCalled();
  });

  it("formats bindings for display", () => {
    expect(formatShortcut({ key: "z", modifiers: ["ctrl", "shift", "alt", "meta"], description: "", handler: vi.fn() })).toBe(
      "Ctrl+Shift+Alt+Meta+Z",
    );
    expect(formatShortcut({ key: "n", description: "", handler: vi.fn() })).toBe("N");
  });
});

describe("useGestureCalibration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts, collects samples and resets", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 100));
    const { result } = renderHook(() => useGestureCalibration());
    expect(result.current.isCalibrating).toBe(false);

    act(() => result.current.start());
    expect(result.current.isCalibrating).toBe(true);

    act(() => {
      for (let index = 0; index < 5; index++) {
        result.current.feed(buildHandLandmarks({ x: 0.5, y: 0.3 }, 0));
      }
    });
    expect(result.current.calibration.samples).toHaveLength(5);
    expect(result.current.profile).toBeNull();

    act(() => result.current.reset());
    expect(result.current.calibration.step).toBe("idle");
  });
});
