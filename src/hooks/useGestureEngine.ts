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
        const SMOOTH_FACTOR = 0.2;
        const smoothX = lerp(prevX.current, rawPos.x, SMOOTH_FACTOR);
        const smoothY = lerp(prevY.current, rawPos.y, SMOOTH_FACTOR);

        prevX.current = smoothX;
        prevY.current = smoothY;

        const pinching = detectPinch(landmarks);
        const fist = detectFist(landmarks);

        setState({
            cursorX: smoothX,
            cursorY: smoothY,
            isPinching: pinching,
            isFist: fist,
        });
    }, [landmarks, viewportWidth, viewportHeight]);

    return state;
}
