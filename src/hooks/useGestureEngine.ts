"use client";

import { useEffect, useRef, useState } from "react";

import {
  computeGestureFrame,
  createCursorHistory,
  createInitialGestureState,
  pushCursorHistory,
} from "@/lib/gestureEngine";
import type { GestureEngineOptions, GestureState } from "@/types/gesture";
import type { HandLandmark } from "@/types/tracking";
import { clamp } from "@/utils/geometry";

const EMIT_INTERVAL_MS = 1000 / 60;
const MOVEMENT_EPSILON = 0.2;

export function useGestureEngine(
  landmarks: HandLandmark[] | null,
  viewportWidth: number,
  viewportHeight: number,
  options: GestureEngineOptions = {},
): GestureState {
  const [state, setState] = useState<GestureState>(() =>
    createInitialGestureState(viewportWidth || 1, viewportHeight || 1),
  );

  const cursorRef = useRef({ x: state.cursorX, y: state.cursorY });
  const pinchingRef = useRef(false);
  const lastEmitRef = useRef<GestureState>(state);
  const lastEmitTimeRef = useRef(0);
  const cursorHistoryRef = useRef(createCursorHistory());

  useEffect(() => {
    const clampedX = clamp(cursorRef.current.x, 0, viewportWidth);
    const clampedY = clamp(cursorRef.current.y, 0, viewportHeight);
    cursorRef.current = { x: clampedX, y: clampedY };

    setState((previous) => {
      if (previous.cursorX === clampedX && previous.cursorY === clampedY) {
        return previous;
      }

      const next = { ...previous, cursorX: clampedX, cursorY: clampedY };
      lastEmitRef.current = { ...lastEmitRef.current, cursorX: clampedX, cursorY: clampedY };
      return next;
    });
  }, [viewportWidth, viewportHeight]);

  useEffect(() => {
    if (!landmarks || landmarks.length < 9) {
      const previous = lastEmitRef.current;
      if (!previous.handDetected && !previous.isPinching && !previous.isFist) {
        return;
      }

      const next: GestureState = {
        ...previous,
        isPinching: false,
        isFist: false,
        handDetected: false,
        swipeDirection: null,
        gestureConfidence: 0,
      };

      pinchingRef.current = false;
      lastEmitRef.current = next;
      setState(next);
      return;
    }

    const frame = computeGestureFrame({
      landmarks,
      viewportWidth,
      viewportHeight,
      previousPinching: pinchingRef.current,
      previousCursor: cursorRef.current,
      options,
      cursorHistory: cursorHistoryRef.current,
    });

    pushCursorHistory(cursorHistoryRef.current, frame.cursor);
    cursorRef.current = frame.cursor;
    pinchingRef.current = frame.isPinching;

    const previous = lastEmitRef.current;
    const moved = Math.hypot(
      frame.state.cursorX - previous.cursorX,
      frame.state.cursorY - previous.cursorY,
    );
    const stateChanged =
      frame.state.isPinching !== previous.isPinching ||
      frame.state.isFist !== previous.isFist ||
      frame.state.handDetected !== previous.handDetected ||
      frame.state.swipeDirection !== previous.swipeDirection;

    const now = performance.now();
    if (
      stateChanged ||
      (moved > MOVEMENT_EPSILON && now - lastEmitTimeRef.current >= EMIT_INTERVAL_MS)
    ) {
      lastEmitRef.current = frame.state;
      lastEmitTimeRef.current = now;
      setState(frame.state);
    }
  }, [landmarks, options, viewportHeight, viewportWidth]);

  return state;
}
