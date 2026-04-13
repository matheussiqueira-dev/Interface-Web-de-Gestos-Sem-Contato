import type { HandLandmark } from "@/types/tracking";
import { detectPinch, distance, getHandScale } from "@/utils/gestures";

export type CalibrationStep =
  | "idle"
  | "open_hand"
  | "pinch_start"
  | "pinch_hold"
  | "fist"
  | "complete"
  | "failed";

export interface CalibrationSample {
  handScale: number;
  thumbIndexDistance: number;
  timestamp: number;
}

export interface CalibrationProfile {
  recommendedPinchSensitivity: number;
  recommendedCursorResponsiveness: number;
  handScale: number;
  capturedAt: string;
}

export interface CalibrationState {
  step: CalibrationStep;
  progress: number;
  samples: CalibrationSample[];
  profile: CalibrationProfile | null;
  error: string | null;
}

const REQUIRED_SAMPLES = 20;
const SAMPLE_INTERVAL_MS = 80;

export function createInitialCalibrationState(): CalibrationState {
  return {
    step: "idle",
    progress: 0,
    samples: [],
    profile: null,
    error: null,
  };
}

/**
 * Advances the calibration state machine for the current step.
 * Should be called on each tracked video frame during calibration.
 *
 * @param state - Current calibration state
 * @param landmarks - Hand landmarks from the current frame, or null if no hand detected
 * @param now - Current timestamp in milliseconds
 */
export function advanceCalibration(
  state: CalibrationState,
  landmarks: HandLandmark[] | null,
  now: number,
): CalibrationState {
  if (state.step === "idle" || state.step === "complete" || state.step === "failed") {
    return state;
  }

  if (!landmarks || landmarks.length < 21) {
    return state.step === "open_hand" ? state : {
      ...state,
      error: "Mao nao detectada. Posicione a mao na frente da camera.",
    };
  }

  const lastSample = state.samples[state.samples.length - 1];
  if (lastSample && now - lastSample.timestamp < SAMPLE_INTERVAL_MS) {
    return state;
  }

  const handScale = getHandScale(landmarks);
  const thumbIndexDistance = distance(landmarks[4], landmarks[8]);

  const sample: CalibrationSample = { handScale, thumbIndexDistance, timestamp: now };

  if (state.step === "open_hand") {
    const isPinching = detectPinch(landmarks, 0.06);
    if (isPinching) {
      return {
        ...state,
        error: "Abra a mao completamente para continuar.",
      };
    }

    const newSamples = [...state.samples, sample];
    const progress = Math.min((newSamples.length / REQUIRED_SAMPLES) * 50, 50);

    if (newSamples.length >= REQUIRED_SAMPLES) {
      return {
        ...state,
        step: "pinch_start",
        samples: newSamples,
        progress,
        error: null,
      };
    }

    return { ...state, samples: newSamples, progress, error: null };
  }

  if (state.step === "pinch_start" || state.step === "pinch_hold") {
    const newSamples = [...state.samples, sample];
    const pinchSamples = newSamples.slice(REQUIRED_SAMPLES);
    const progress = 50 + Math.min((pinchSamples.length / REQUIRED_SAMPLES) * 50, 50);

    if (pinchSamples.length >= REQUIRED_SAMPLES) {
      const profile = computeCalibrationProfile(
        newSamples.slice(0, REQUIRED_SAMPLES),
        pinchSamples,
      );

      return {
        ...state,
        step: "complete",
        samples: newSamples,
        progress: 100,
        profile,
        error: null,
      };
    }

    return {
      ...state,
      step: "pinch_hold",
      samples: newSamples,
      progress,
      error: null,
    };
  }

  return state;
}

/**
 * Starts the calibration sequence from idle.
 */
export function startCalibration(state: CalibrationState): CalibrationState {
  return {
    step: "open_hand",
    progress: 0,
    samples: [],
    profile: null,
    error: null,
  };
}

/**
 * Resets the calibration to idle state.
 */
export function resetCalibration(): CalibrationState {
  return createInitialCalibrationState();
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeCalibrationProfile(
  openSamples: CalibrationSample[],
  pinchSamples: CalibrationSample[],
): CalibrationProfile {
  const avgHandScale = mean(openSamples.map((s) => s.handScale));
  const avgPinchDistance = mean(pinchSamples.map((s) => s.thumbIndexDistance));
  const avgOpenDistance = mean(openSamples.map((s) => s.thumbIndexDistance));

  const pinchRatio = avgHandScale > 0 ? avgPinchDistance / avgHandScale : 0.3;
  const openRatio = avgHandScale > 0 ? avgOpenDistance / avgHandScale : 0.8;
  const spread = openRatio - pinchRatio;

  const recommendedPinchSensitivity = spread > 0.4 ? 0.8 : spread > 0.25 ? 1.0 : 1.3;
  const handSizeFactor = avgHandScale > 0.25 ? 0.9 : avgHandScale > 0.18 ? 1.0 : 1.2;

  return {
    recommendedPinchSensitivity,
    recommendedCursorResponsiveness: handSizeFactor,
    handScale: avgHandScale,
    capturedAt: new Date().toISOString(),
  };
}
