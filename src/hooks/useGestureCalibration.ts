"use client";

import { useCallback, useState } from "react";

import {
  advanceCalibration,
  createInitialCalibrationState,
  resetCalibration,
  startCalibration,
  type CalibrationProfile,
  type CalibrationState,
} from "@/lib/calibration/calibrationEngine";
import type { HandLandmark } from "@/types/tracking";

export interface UseGestureCalibrationReturn {
  calibration: CalibrationState;
  isCalibrating: boolean;
  profile: CalibrationProfile | null;
  start: () => void;
  reset: () => void;
  feed: (landmarks: HandLandmark[] | null) => void;
}

/**
 * Manages the gesture calibration lifecycle.
 * Call start() to begin, then feed() on each tracked frame.
 * The calibration profile is available once step === 'complete'.
 */
export function useGestureCalibration(): UseGestureCalibrationReturn {
  const [calibration, setCalibration] = useState<CalibrationState>(
    createInitialCalibrationState,
  );

  const start = useCallback(() => {
    setCalibration((prev) => startCalibration(prev));
  }, []);

  const reset = useCallback(() => {
    setCalibration(resetCalibration());
  }, []);

  const feed = useCallback((landmarks: HandLandmark[] | null) => {
    const now = performance.now();
    setCalibration((prev) => advanceCalibration(prev, landmarks, now));
  }, []);

  return {
    calibration,
    isCalibrating: calibration.step !== "idle" && calibration.step !== "complete" && calibration.step !== "failed",
    profile: calibration.profile,
    start,
    reset,
    feed,
  };
}
