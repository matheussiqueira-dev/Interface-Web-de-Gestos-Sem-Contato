import { memo } from "react";

import { PinchRing } from "@/components/gesture/PinchRing";

interface PinchCursorProps {
  x: number;
  y: number;
  visible: boolean;
  progress: number;
  pinching: boolean;
}

function PinchCursorComponent({ x, y, visible, progress, pinching }: PinchCursorProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="pinch-cursor" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }} aria-hidden="true">
      <PinchRing progress={progress} pinching={pinching} />
    </div>
  );
}

export const PinchCursor = memo(PinchCursorComponent);
