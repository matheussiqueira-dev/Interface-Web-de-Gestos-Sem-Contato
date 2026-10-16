"use client";

import { type RefObject, useEffect, useState } from "react";

import type { GestureState } from "@/types/gesture";

export const IDLE_GESTURE: GestureState = {
  cursorX: 0,
  cursorY: 0,
  isPinching: false,
  isFist: false,
  handDetected: false,
  swipeDirection: null,
  gestureConfidence: 0,
  pinchProgress: 0,
};

const EDITABLE_SELECTOR = "textarea, input, select, button, a, [contenteditable='true']";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element) || target.closest("[data-drag-handle]")) {
    return false;
  }
  return target.closest(EDITABLE_SELECTOR) !== null;
}

/**
 * Mouse and touch input expressed as the same GestureState the hand engine
 * produces: pressing the primary button (or touching) is a pinch, so the board
 * drags notes and draws exactly as it does with a hand. Presses that start on
 * a text field or button are left to that control.
 */
export function usePointerGesture(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): GestureState {
  const [state, setState] = useState<GestureState>(IDLE_GESTURE);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) {
      return;
    }

    let activePointer: number | null = null;

    const toBoard = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      return { cursorX: event.clientX - rect.left, cursorY: event.clientY - rect.top };
    };

    const handleMove = (event: PointerEvent) => {
      if (activePointer !== null && event.pointerId !== activePointer) {
        return;
      }
      const point = toBoard(event);
      setState((previous) => ({ ...previous, ...point, handDetected: true }));
    };

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0 || activePointer !== null || isEditableTarget(event.target)) {
        return;
      }
      activePointer = event.pointerId;
      element.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      const point = toBoard(event);
      setState((previous) => ({
        ...previous,
        ...point,
        handDetected: true,
        isPinching: true,
        pinchProgress: 1,
      }));
    };

    const handleUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) {
        return;
      }
      activePointer = null;
      if (element.hasPointerCapture?.(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      setState((previous) => ({
        ...previous,
        isPinching: false,
        pinchProgress: 0,
        handDetected: event.pointerType === "mouse",
      }));
    };

    const handleLeave = () => {
      if (activePointer === null) {
        setState((previous) => ({ ...previous, handDetected: false }));
      }
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("pointerleave", handleLeave);
      setState(IDLE_GESTURE);
    };
  }, [enabled, ref]);

  return enabled ? state : IDLE_GESTURE;
}
