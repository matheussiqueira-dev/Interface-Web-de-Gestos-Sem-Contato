const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PinchRingProps {
  /** 0 = fingers far apart, 1 = gap at or inside the pinch threshold. */
  progress: number;
  pinching: boolean;
  size?: number;
}

/**
 * The cursor's signature: a ring that closes as the thumb-index gap reaches
 * the pinch threshold and turns into the accent once the pinch is active.
 * Because the release threshold is larger than the start threshold, the ring
 * stays closed a little longer when the fingers open: hysteresis you can see.
 */
export function PinchRing({ progress, pinching, size = 44 }: PinchRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <svg
      className="pinch-ring"
      data-pinching={pinching ? "true" : "false"}
      width={size}
      height={size}
      viewBox="-22 -22 44 44"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="pinch-ring__halo" r={RADIUS} />
      <circle className="pinch-ring__track" r={RADIUS} />
      <circle
        className="pinch-ring__progress"
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        transform="rotate(-90)"
      />
      <circle className="pinch-ring__dot" r={pinching ? 5 : 3} />
    </svg>
  );
}
