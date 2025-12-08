import { useState, useEffect, useRef, useCallback } from 'react';
import type { HandTrackingResult, GestureState, GestureType, CursorPosition } from '../types';

const PINCH_THRESHOLD = 0.05;
const FIST_THRESHOLD = 0.15;
const SMOOTHING_FACTOR = 0.3;
const STABILITY_FRAMES = 5;

export const useGestureEngine = (handData: HandTrackingResult | null) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    type: 'none',
    confidence: 0,
    position: { x: 0, y: 0 },
    isStable: false
  });

  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    x: 0,
    y: 0,
    smoothX: 0,
    smoothY: 0
  });

  const gestureHistoryRef = useRef<GestureType[]>([]);
  const previousGestureRef = useRef<GestureType>('none');

  // Calculate distance between two landmarks
  const calculateDistance = useCallback((p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, []);

  // Detect pinch gesture (thumb tip and index finger tip close together)
  const detectPinch = useCallback((landmarks: any[]) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = calculateDistance(thumbTip, indexTip);
    return distance < PINCH_THRESHOLD;
  }, [calculateDistance]);

  // Detect fist gesture (all fingertips close to palm)
  const detectFist = useCallback((landmarks: any[]) => {
    const palmBase = landmarks[0];
    const fingerTips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    
    let totalDistance = 0;
    fingerTips.forEach(tip => {
      totalDistance += calculateDistance(tip, palmBase);
    });
    
    const avgDistance = totalDistance / fingerTips.length;
    return avgDistance < FIST_THRESHOLD;
  }, [calculateDistance]);

  // Smooth cursor movement
  const smoothPosition = useCallback((current: CursorPosition, targetX: number, targetY: number): CursorPosition => {
    return {
      x: targetX,
      y: targetY,
      smoothX: current.smoothX + (targetX - current.smoothX) * SMOOTHING_FACTOR,
      smoothY: current.smoothY + (targetY - current.smoothY) * SMOOTHING_FACTOR
    };
  }, []);

  // Stabilize gesture detection
  const isGestureStable = useCallback((gestureType: GestureType) => {
    gestureHistoryRef.current.push(gestureType);
    
    if (gestureHistoryRef.current.length > STABILITY_FRAMES) {
      gestureHistoryRef.current.shift();
    }

    const stableGesture = gestureHistoryRef.current[0];
    return gestureHistoryRef.current.every(g => g === stableGesture) && 
           gestureHistoryRef.current.length === STABILITY_FRAMES;
  }, []);

  // Process hand data and detect gestures
  useEffect(() => {
    if (!handData || !handData.landmarks || handData.landmarks.length < 21) {
      setGestureState({
        type: 'none',
        confidence: 0,
        position: { x: 0, y: 0 },
        isStable: false
      });
      setCursorPosition(prev => smoothPosition(prev, 0, 0));
      gestureHistoryRef.current = [];
      return;
    }

    const landmarks = handData.landmarks;

    // Use index finger tip for cursor position
    const indexTip = landmarks[8];
    const newPosition = smoothPosition(
      cursorPosition,
      indexTip.x,
      indexTip.y
    );
    setCursorPosition(newPosition);

    // Detect gesture
    let detectedGesture: GestureType = 'none';
    let confidence = 0;

    if (detectPinch(landmarks)) {
      detectedGesture = 'pinch';
      confidence = 0.9;
    } else if (detectFist(landmarks)) {
      detectedGesture = 'fist';
      confidence = 0.85;
    } else {
      detectedGesture = 'open';
      confidence = 0.8;
    }

    const isStable = isGestureStable(detectedGesture);

    // Only update gesture state if it's stable or different from previous
    if (isStable || detectedGesture !== previousGestureRef.current) {
      setGestureState({
        type: detectedGesture,
        confidence,
        position: { x: indexTip.x, y: indexTip.y },
        isStable
      });
      
      if (isStable) {
        previousGestureRef.current = detectedGesture;
      }
    }
  }, [handData, cursorPosition, detectPinch, detectFist, smoothPosition, isGestureStable]);

  return {
    gestureState,
    cursorPosition
  };
};
