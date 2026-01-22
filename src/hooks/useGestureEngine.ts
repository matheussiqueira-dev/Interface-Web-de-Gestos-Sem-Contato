// src/hooks/useGestureEngine.ts
import { useEffect, useState, useRef } from "react";
import { detectPinch, detectFist } from "../utils/gestures";
import { landmarkToScreen, lerp } from "../utils/geometry";
import type { HandLandmark } from "../types/hand";

interface GestureState {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
    isFist: boolean;
    handDetected: boolean;
}

const SMOOTH_FACTOR = 0.12;
const START_PINCH = 0.05;
const STOP_PINCH = 0.085;

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
        handDetected: false,
    });

    // Smoothing refs
    const prevX = useRef(viewportWidth / 2);
    const prevY = useRef(viewportHeight / 2);
    const pinchRef = useRef(false);

    useEffect(() => {
        if (!landmarks || landmarks.length < 9) {
            setState(prev => {
                if (!prev.handDetected && !prev.isPinching && !prev.isFist) return prev;
                return { ...prev, isPinching: false, isFist: false, handDetected: false };
            });
            return;
        }

        // Index tip for cursor
        const indexTip = landmarks[8];
        const rawPos = landmarkToScreen(indexTip, viewportWidth, viewportHeight);

        // Simple smoothing (LERP)
        // Lower factor = smoother but more lag. 0.1 is a good balance for drawing.
        const smoothX = lerp(prevX.current, rawPos.x, SMOOTH_FACTOR);
        const smoothY = lerp(prevY.current, rawPos.y, SMOOTH_FACTOR);

        prevX.current = smoothX;
        prevY.current = smoothY;

        // Hysteresis for stable pinching
        // Harder to start (0.04), harder to lose (0.08)
        const currentThreshold = pinchRef.current ? STOP_PINCH : START_PINCH;

        const pinching = detectPinch(landmarks, currentThreshold);
        const fist = detectFist(landmarks);

        pinchRef.current = pinching;

        setState({
            cursorX: smoothX,
            cursorY: smoothY,
            isPinching: pinching,
            isFist: fist,
            handDetected: true,
        });
    }, [landmarks, viewportWidth, viewportHeight]);

    return state;
}
