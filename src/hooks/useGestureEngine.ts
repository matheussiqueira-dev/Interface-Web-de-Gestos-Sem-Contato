// src/hooks/useGestureEngine.ts
import { useEffect, useState, useRef } from "react";
import { detectPinch, detectFist, HandLandmark } from "../utils/gestures";
import { landmarkToScreen, lerp } from "../utils/geometry";

interface GestureState {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
    isFist: boolean;
}

export function useGestureEngine(
    landmarks: HandLandmark[] | null,
    viewportWidth: number,
    viewportHeight: number
): GestureState {
    const [state, setState] = useState<GestureState>({
        cursorX: viewportWidth / 2,
        cursorY: viewportHeight / 2,
        isPinching: false,
        isFist: false,
    });

    // Smoothing refs
    const prevX = useRef(viewportWidth / 2);
    const prevY = useRef(viewportHeight / 2);

    useEffect(() => {
        if (!landmarks) {
            return;
        }

        // Index tip for cursor
        const indexTip = landmarks[8];
        const rawPos = landmarkToScreen(indexTip, viewportWidth, viewportHeight);

        // Simple smoothing (LERP)
        // Lower factor = smoother but more lag. 0.1 is a good balance for drawing.
        const SMOOTH_FACTOR = 0.1;
        const smoothX = lerp(prevX.current, rawPos.x, SMOOTH_FACTOR);
        const smoothY = lerp(prevY.current, rawPos.y, SMOOTH_FACTOR);

        prevX.current = smoothX;
        prevY.current = smoothY;

        // Hysteresis for stable pinching
        // Harder to start (0.04), harder to lose (0.08)
        const START_PINCH = 0.05;
        const STOP_PINCH = 0.08;
        const currentThreshold = state.isPinching ? STOP_PINCH : START_PINCH;

        const pinching = detectPinch(landmarks, currentThreshold);
        const fist = detectFist(landmarks);

        setState({
            cursorX: smoothX,
            cursorY: smoothY,
            isPinching: pinching,
            isFist: fist,
        });
    }, [landmarks, viewportWidth, viewportHeight, state.isPinching]);

    return state;
}
