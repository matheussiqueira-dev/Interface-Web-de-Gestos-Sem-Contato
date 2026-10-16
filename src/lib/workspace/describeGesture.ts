import type { GestureState } from "@/types/gesture";
import type { InputMode } from "@/types/input";

interface GestureContext {
  mode: InputMode;
  gesture: Pick<GestureState, "handDetected" | "isPinching" | "isFist">;
  trackingEnabled: boolean;
  draggingNote: boolean;
}

/**
 * Plain-language description of what the current input is doing, announced
 * through an aria-live region. Changes only when the meaning changes.
 */
export function describeGesture({ mode, gesture, trackingEnabled, draggingNote }: GestureContext): string {
  const pointer = mode === "pointer";

  if (!trackingEnabled && !pointer) {
    return "Rastreamento pausado";
  }
  if (!gesture.handDetected) {
    return pointer ? "Leve o cursor até o quadro" : "Procurando a mão";
  }
  if (gesture.isFist) {
    return "Punho fechado: desenho pausado";
  }
  if (gesture.isPinching) {
    const action = draggingNote ? "arrastando nota" : "desenhando";
    return pointer ? `Pressionado: ${action}` : `Pinça: ${action}`;
  }
  return pointer ? "Cursor sobre o quadro" : "Mão aberta: movendo o cursor";
}
