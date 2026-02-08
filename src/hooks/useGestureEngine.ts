// src/hooks/useGestureEngine.ts
import { useEffect, useState, useRef } from "react";
import { detectPinch, detectFist, getHandScale } from "../utils/gestures";
import { clamp, landmarkToScreen, lerp } from "../utils/geometry";
import type { HandLandmark } from "../types/hand";

interface GestureState {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
    isFist: boolean;
    handDetected: boolean;
}

interface GestureEngineOptions {
    pinchSensitivity?: number;
    cursorResponsiveness?: number;
}

const MIN_SMOOTH = 0.08;
const MAX_SMOOTH = 0.32;
const SPEED_NORMALIZER = 120;

const START_PINCH_ABS = 0.05;
const STOP_PINCH_ABS = 0.085;
const START_PINCH_RATIO = 0.3;
const STOP_PINCH_RATIO = 0.4;
const MIN_PINCH_ABS = 0.025;
const MAX_PINCH_ABS = 0.12;

const EMIT_INTERVAL_MS = 1000 / 60;
const MOVEMENT_EPSILON = 0.2;

export function useGestureEngine(
    landmarks: HandLandmark[] | null,
    viewportWidth: number,
    viewportHeight: number,
    options: GestureEngineOptions = {}
): GestureState {
    const initialState = {
        cursorX: viewportWidth / 2,
        cursorY: viewportHeight / 2,
        isPinching: false,
        isFist: false,
        handDetected: false,
    };
    const [state, setState] = useState<GestureState>(initialState);

    // Smoothing refs
    const prevX = useRef(initialState.cursorX);
    const prevY = useRef(initialState.cursorY);
    const pinchRef = useRef(false);
    const lastEmitRef = useRef<GestureState>(initialState);
    const lastEmitTimeRef = useRef(0);

    useEffect(() => {
        const clampedX = clamp(prevX.current, 0, viewportWidth);
        const clampedY = clamp(prevY.current, 0, viewportHeight);
        prevX.current = clampedX;
        prevY.current = clampedY;

        setState(prev => {
            if (prev.cursorX === clampedX && prev.cursorY === clampedY) return prev;
            const next = { ...prev, cursorX: clampedX, cursorY: clampedY };
            lastEmitRef.current = { ...lastEmitRef.current, cursorX: clampedX, cursorY: clampedY };
            return next;
        });
    }, [viewportWidth, viewportHeight]);

    useEffect(() => {
        if (!landmarks || landmarks.length < 9) {
            const last = lastEmitRef.current;
            if (!last.handDetected && !last.isPinching && !last.isFist) return;
            const next = { ...last, isPinching: false, isFist: false, handDetected: false };
            lastEmitRef.current = next;
            setState(prev => (prev.handDetected || prev.isPinching || prev.isFist ? next : prev));
            return;
        }

        // Index tip for cursor
        const indexTip = landmarks[8];
        const rawPos = landmarkToScreen(indexTip, viewportWidth, viewportHeight);
        const clampedPos = {
            x: clamp(rawPos.x, 0, viewportWidth),
            y: clamp(rawPos.y, 0, viewportHeight),
        };
        const responsiveness = clamp(options.cursorResponsiveness ?? 1, 0.6, 1.7);
        const speed = Math.hypot(clampedPos.x - prevX.current, clampedPos.y - prevY.current);
        const smoothFactor = clamp((speed / SPEED_NORMALIZER) * responsiveness, MIN_SMOOTH, MAX_SMOOTH);

        // Adaptive smoothing: stable when slow, responsive when fast.
        const smoothX = lerp(prevX.current, clampedPos.x, smoothFactor);
        const smoothY = lerp(prevY.current, clampedPos.y, smoothFactor);

        prevX.current = smoothX;
        prevY.current = smoothY;

        // Hysteresis for stable pinching
        // Harder to start (0.04), harder to lose (0.08)
        const handScale = getHandScale(landmarks);
        const ratioThreshold = (pinchRef.current ? STOP_PINCH_RATIO : START_PINCH_RATIO) * handScale;
        const fallbackThreshold = pinchRef.current ? STOP_PINCH_ABS : START_PINCH_ABS;
        const currentThreshold = handScale
            ? clamp(ratioThreshold, MIN_PINCH_ABS, MAX_PINCH_ABS)
            : fallbackThreshold;

        const sensitivity = clamp(options.pinchSensitivity ?? 1, 0.6, 1.7);
        const adjustedThreshold = clamp(currentThreshold * sensitivity, MIN_PINCH_ABS, MAX_PINCH_ABS);
        const pinching = detectPinch(landmarks, adjustedThreshold);
        const fist = detectFist(landmarks);

        pinchRef.current = pinching;
        const next = {
            cursorX: smoothX,
            cursorY: smoothY,
            isPinching: pinching,
            isFist: fist,
            handDetected: true,
        };

        const last = lastEmitRef.current;
        const moved = Math.hypot(next.cursorX - last.cursorX, next.cursorY - last.cursorY);
        const stateChanged =
            next.isPinching !== last.isPinching ||
            next.isFist !== last.isFist ||
            !last.handDetected;
        const now = performance.now();

        if (stateChanged || (moved > MOVEMENT_EPSILON && now - lastEmitTimeRef.current >= EMIT_INTERVAL_MS)) {
            lastEmitRef.current = next;
            lastEmitTimeRef.current = now;
            setState(next);
        }
    }, [
        landmarks,
        options.cursorResponsiveness,
        options.pinchSensitivity,
        viewportWidth,
        viewportHeight,
    ]);

    return state;
}
