"use client";

import { useEffect, useRef, useState } from "react";

import {
  boardToLandmark,
  buildHandLandmarks,
  createDemoScene,
  type DemoScene,
  sampleScript,
} from "@/lib/demo/simulatedHand";
import type { Size } from "@/lib/workspace/layout";
import type { HandLandmark } from "@/types/tracking";

const FRAME_INTERVAL_MS = 1000 / 30;

/**
 * Plays the demo script as a stream of simulated hand landmarks at 30 fps,
 * the rate the camera pipeline runs at. `onCycleStart` fires with the scene at
 * the start of every loop so the board can reset its notes and drawing.
 */
export function useSimulatedHand(
  enabled: boolean,
  board: Size,
  onCycleStart: (scene: DemoScene) => void,
): HandLandmark[] | null {
  const [landmarks, setLandmarks] = useState<HandLandmark[] | null>(null);
  const onCycleStartRef = useRef(onCycleStart);

  useEffect(() => {
    onCycleStartRef.current = onCycleStart;
  }, [onCycleStart]);

  useEffect(() => {
    if (!enabled || board.width === 0 || board.height === 0) {
      return;
    }

    const size = { width: board.width, height: board.height };
    const scene = createDemoScene(size);
    let frameId = 0;
    let startedAt: number | null = null;
    let cycle = -1;
    let lastEmit = -Infinity;

    const tick = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;
      const currentCycle = Math.floor(elapsed / scene.durationMs);
      if (currentCycle !== cycle) {
        cycle = currentCycle;
        onCycleStartRef.current(scene);
      }

      if (now - lastEmit >= FRAME_INTERVAL_MS) {
        lastEmit = now;
        const frame = sampleScript(scene.script, elapsed);
        setLandmarks(buildHandLandmarks(boardToLandmark(frame, size), frame.pinch));
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      setLandmarks(null);
    };
  }, [board.height, board.width, enabled]);

  return enabled ? landmarks : null;
}
