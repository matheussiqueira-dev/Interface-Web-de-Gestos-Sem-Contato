// src/hooks/useHandTracking.ts
import { useEffect, useState, useRef } from "react";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export interface HandLandmark {
    x: number; // 0–1
    y: number; // 0–1
    z: number;
}

export function useHandTracking(video: HTMLVideoElement | null) {
    const [landmarks, setLandmarks] = useState<HandLandmark[] | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>();

    useEffect(() => {
        async function initMediaPipe() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
                );

                handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });

                console.log("MediaPipe HandLandmarker loaded");
            } catch (error) {
                console.error("Error loading MediaPipe:", error);
            }
        }

        initMediaPipe();

        return () => {
            // Cleanup if needed
        };
    }, []);

    useEffect(() => {
        if (!video || !handLandmarkerRef.current) return;

        let startTimeMs = performance.now();

        const loop = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const result: HandLandmarkerResult = handLandmarkerRef.current!.detectForVideo(video, startTimeMs);

                    if (result.landmarks && result.landmarks.length > 0) {
                        // Cast to our simple interface
                        setLandmarks(result.landmarks[0] as HandLandmark[]);
                    } else {
                        setLandmarks(null);
                    }
                } catch (e) {
                    console.warn(e);
                }
                startTimeMs = performance.now();
            }
            requestRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [video, handLandmarkerRef.current]);

    return landmarks;
}
