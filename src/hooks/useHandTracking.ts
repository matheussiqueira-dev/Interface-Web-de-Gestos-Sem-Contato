"use client";

import type { HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { logger } from "@/core/system/logger";
import { createHandLandmarker } from "@/services/mediapipe.service";
import type { HandTrackingState } from "@/types/tracking";

interface VideoFrameMetadata {
  mediaTime?: number;
}

type VideoFrameCallback = (now: number, metadata?: VideoFrameMetadata) => void;

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: VideoFrameCallback) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/**
 * Clamps the effective FPS target to a safe range and computes the minimum
 * inter-frame interval in milliseconds.
 */
function resolveFrameInterval(maxFps: number): number {
  const clamped = Math.min(Math.max(maxFps, 5), 60);
  return 1000 / clamped;
}

export function useHandTracking(
  videoElement: HTMLVideoElement | null,
  enabled = true,
  maxFps = 30,
): HandTrackingState {
  const [state, setState] = useState<HandTrackingState>({
    landmarks: null,
    status: "idle",
    error: null,
  });

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastProcessedAtRef = useRef(0);
  const isVisibleRef = useRef(true);
  const consecutiveEmptyRef = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    isVisibleRef.current = !document.hidden;
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (document.hidden) {
        setState((previous) => ({ ...previous, landmarks: null }));
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState((previous) => ({ ...previous, landmarks: null, status: "idle", error: null }));
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      return;
    }

    let cancelled = false;

    const init = async () => {
      setState((previous) => ({ ...previous, status: "loading", error: null }));

      try {
        const landmarker = await createHandLandmarker();
        if (cancelled) {
          landmarker.close?.();
          return;
        }

        landmarkerRef.current = landmarker;
        setState((previous) => ({ ...previous, status: "ready", error: null }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Falha ao carregar o modelo de mao.";
        logger.error("Falha ao carregar MediaPipe", error);
        setState((previous) => ({ ...previous, status: "error", error: message }));
      }
    };

    void init();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !videoElement || !landmarkerRef.current || state.status !== "ready") {
      return;
    }

    const video = videoElement as VideoWithFrameCallback;
    const frameInterval = resolveFrameInterval(maxFps);
    let mounted = true;

    lastVideoTimeRef.current = -1;
    lastProcessedAtRef.current = 0;
    consecutiveEmptyRef.current = 0;

    const scheduleNext = (delay?: number) => {
      if (!mounted) {
        return;
      }

      if (delay && delay > 0) {
        setTimeout(() => scheduleNext(), delay);
        return;
      }

      if (video.requestVideoFrameCallback) {
        videoFrameRef.current = video.requestVideoFrameCallback((timestamp) => tick(timestamp));
      } else {
        rafRef.current = requestAnimationFrame((timestamp) => tick(timestamp));
      }
    };

    const tick = (timestamp: number) => {
      if (!mounted) {
        return;
      }

      if (!isVisibleRef.current || !enabled) {
        setState((previous) => (previous.landmarks ? { ...previous, landmarks: null } : previous));
        scheduleNext();
        return;
      }

      if (timestamp - lastProcessedAtRef.current < frameInterval) {
        scheduleNext();
        return;
      }

      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        try {
          const result: HandLandmarkerResult = landmarkerRef.current!.detectForVideo(
            video,
            timestamp,
          );
          lastVideoTimeRef.current = video.currentTime;
          lastProcessedAtRef.current = timestamp;

          const nextLandmarks = result.landmarks?.[0] ?? null;

          if (!nextLandmarks) {
            consecutiveEmptyRef.current += 1;
          } else {
            consecutiveEmptyRef.current = 0;
          }

          setState((previous) => {
            if (!nextLandmarks && !previous.landmarks) {
              return previous;
            }
            return {
              ...previous,
              landmarks: nextLandmarks,
            };
          });

          // Adaptive throttle: when no hand detected for 10+ frames, slow poll to 10fps
          const adaptiveInterval = consecutiveEmptyRef.current > 10
            ? Math.max(frameInterval, 100)
            : undefined;

          scheduleNext(adaptiveInterval);
          return;
        } catch (error) {
          logger.warn("Erro durante inferencia de gesto", error);
        }
      }

      scheduleNext();
    };

    scheduleNext();

    return () => {
      mounted = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      if (videoFrameRef.current !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameRef.current);
      }
    };
  }, [enabled, maxFps, state.status, videoElement]);

  return state;
}
