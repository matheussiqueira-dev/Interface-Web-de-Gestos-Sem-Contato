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
    const videoFrameRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const isVisibleRef = useRef(!document.hidden);
    const hasLandmarksRef = useRef(false);

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
            hasLandmarksRef.current = false;
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

                const createLandmarker = (delegate: "GPU" | "CPU") =>
                    HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                            delegate,
                        },
                        runningMode: "VIDEO",
                        numHands: 1,
                    });

                let landmarker: HandLandmarker;
                try {
                    landmarker = await createLandmarker("GPU");
                } catch (gpuError) {
                    console.warn("GPU delegate failed, falling back to CPU:", gpuError);
                    landmarker = await createLandmarker("CPU");
                }

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
        lastVideoTimeRef.current = -1;
        type VideoFrameCallback = (now: number, metadata?: { mediaTime?: number }) => void;
        const videoElement = video as HTMLVideoElement & {
            requestVideoFrameCallback?: (callback: VideoFrameCallback) => number;
            cancelVideoFrameCallback?: (handle: number) => void;
        };

        const scheduleNext = () => {
            if (!mounted) return;
            if (videoElement.requestVideoFrameCallback) {
                videoFrameRef.current = videoElement.requestVideoFrameCallback((now) => tick(now));
            } else {
                requestRef.current = requestAnimationFrame((now) => tick(now));
            }
        };

        const tick = (timestamp?: number) => {
            if (!mounted) return;

            if (!enabled || !isVisibleRef.current) {
                if (hasLandmarksRef.current) {
                    hasLandmarksRef.current = false;
                    setLandmarks(null);
                }
                scheduleNext();
                return;
            }

            if (videoElement.readyState >= 2) {
                const now = typeof timestamp === "number" ? timestamp : performance.now();
                if (videoElement.currentTime !== lastVideoTimeRef.current) {
                    lastVideoTimeRef.current = videoElement.currentTime;
                    try {
                        const result: HandLandmarkerResult =
                            handLandmarkerRef.current!.detectForVideo(videoElement, now);

                        if (result.landmarks && result.landmarks.length > 0) {
                            hasLandmarksRef.current = true;
                            setLandmarks(result.landmarks[0] as HandLandmark[]);
                        } else if (hasLandmarksRef.current) {
                            hasLandmarksRef.current = false;
                            setLandmarks(null);
                        }
                    } catch (e) {
                        console.warn("Hand tracking error:", e);
                    }
                }
            }

            scheduleNext();
        };

        scheduleNext();

        return () => {
            mounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoFrameRef.current !== null && videoElement.cancelVideoFrameCallback) {
                videoElement.cancelVideoFrameCallback(videoFrameRef.current);
            }
        };
    }, [video, enabled, status]);

    return { landmarks, status, error };
}
