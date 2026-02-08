import { useEffect, useRef, useState } from "react";

interface UseSessionMetricsParams {
  handDetected: boolean;
  isPinching: boolean;
  isFist: boolean;
  trackingEnabled: boolean;
}

interface SessionMetrics {
  elapsedSeconds: number;
  pinchCount: number;
  fistCount: number;
  handPresence: number;
  interactionRate: number;
}

export function useSessionMetrics({
  handDetected,
  isPinching,
  isFist,
  trackingEnabled,
}: UseSessionMetricsParams): SessionMetrics {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    elapsedSeconds: 0,
    pinchCount: 0,
    fistCount: 0,
    handPresence: 0,
    interactionRate: 0,
  });

  const handDetectedRef = useRef(handDetected);
  const pinchingRef = useRef(isPinching);
  const fistRef = useRef(isFist);
  const pinchesRef = useRef(0);
  const fistsRef = useRef(0);
  const elapsedRef = useRef(0);
  const handFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const interactionsRef = useRef(0);

  useEffect(() => {
    handDetectedRef.current = handDetected;
  }, [handDetected]);

  useEffect(() => {
    if (isPinching && !pinchingRef.current) {
      pinchesRef.current += 1;
      interactionsRef.current += 1;
    }
    pinchingRef.current = isPinching;
  }, [isPinching]);

  useEffect(() => {
    if (isFist && !fistRef.current) {
      fistsRef.current += 1;
      interactionsRef.current += 1;
    }
    fistRef.current = isFist;
  }, [isFist]);

  useEffect(() => {
    if (!trackingEnabled) {
      return;
    }

    let animationFrame = 0;
    let lastTick = performance.now();

    const sample = (timestamp: number) => {
      totalFramesRef.current += 1;
      if (handDetectedRef.current) {
        handFramesRef.current += 1;
      }

      if (timestamp - lastTick >= 1000) {
        elapsedRef.current += 1;
        lastTick = timestamp;

        const handPresence =
          totalFramesRef.current > 0
            ? (handFramesRef.current / totalFramesRef.current) * 100
            : 0;

        const interactionRate =
          elapsedRef.current > 0 ? interactionsRef.current / elapsedRef.current : 0;

        setMetrics({
          elapsedSeconds: elapsedRef.current,
          pinchCount: pinchesRef.current,
          fistCount: fistsRef.current,
          handPresence,
          interactionRate,
        });
      }

      animationFrame = requestAnimationFrame(sample);
    };

    animationFrame = requestAnimationFrame(sample);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [trackingEnabled]);

  return metrics;
}
