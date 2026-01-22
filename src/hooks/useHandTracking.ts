// src/hooks/useHandTracking.ts
import { useEffect, useState, useRef } from "react";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { HandLandmark } from "../types/hand";

type HandTrackingStatus = "idle" | "loading" | "ready" | "error";

interface HandTrackingState {
    landmarks: HandLandmark[] | null;
    status: HandTrackingStatus;
    error: string | null;
}

export function useHandTracking(video: HTMLVideoElement | null, enabled = true): HandTrackingState {
    const [landmarks, setLandmarks] = useState<HandLandmark[] | null>(null);
    const [status, setStatus] = useState<HandTrackingStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>();
    const lastVideoTimeRef = useRef(-1);
    const isVisibleRef = useRef(!document.hidden);

    useEffect(() => {
        const handleVisibility = () => {
            isVisibleRef.current = !document.hidden;
            if (document.hidden) {
                setLandmarks(null);
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (!enabled) {
            setLandmarks(null);
        }
    }, [enabled]);

    useEffect(() => {
        let cancelled = false;

        async function initMediaPipe() {
            setStatus("loading");
            setError(null);

            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
                );

                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                });

                if (cancelled) {
                    landmarker.close?.();
                    return;
                }

                handLandmarkerRef.current = landmarker;
                setStatus("ready");
            } catch (err) {
                if (cancelled) return;
                setStatus("error");
                setError(err instanceof Error ? err.message : "Falha ao carregar o modelo de mão.");
                console.error("Error loading MediaPipe:", err);
            }
        }

        initMediaPipe();

        return () => {
            cancelled = true;
            handLandmarkerRef.current?.close?.();
        };
    }, []);

    useEffect(() => {
        if (!video || !handLandmarkerRef.current || status !== "ready") return;

        let mounted = true;

        const loop = () => {
            if (!mounted) return;

            if (!enabled || !isVisibleRef.current) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            if (video.readyState >= 2) {
                const now = performance.now();
                if (video.currentTime !== lastVideoTimeRef.current) {
                    lastVideoTimeRef.current = video.currentTime;
                    try {
                        const result: HandLandmarkerResult =
                            handLandmarkerRef.current!.detectForVideo(video, now);

                        if (result.landmarks && result.landmarks.length > 0) {
                            setLandmarks(result.landmarks[0] as HandLandmark[]);
                        } else {
                            setLandmarks(null);
                        }
                    } catch (e) {
                        console.warn("Hand tracking error:", e);
                    }
                }
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            mounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [video, enabled, status]);

    return { landmarks, status, error };
}
