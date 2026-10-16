import { describe, expect, it } from "vitest";

import { describeGesture } from "@/lib/workspace/describeGesture";

const open = { handDetected: true, isPinching: false, isFist: false };

describe("describeGesture", () => {
  it("reports a paused tracker for hand inputs only", () => {
    expect(describeGesture({ mode: "camera", gesture: open, trackingEnabled: false, draggingNote: false })).toBe(
      "Rastreamento pausado",
    );
    expect(describeGesture({ mode: "pointer", gesture: open, trackingEnabled: false, draggingNote: false })).toBe(
      "Cursor sobre o quadro",
    );
  });

  it("asks for the hand or the cursor when there is no input", () => {
    const none = { ...open, handDetected: false };
    expect(describeGesture({ mode: "demo", gesture: none, trackingEnabled: true, draggingNote: false })).toBe(
      "Procurando a mão",
    );
    expect(describeGesture({ mode: "pointer", gesture: none, trackingEnabled: true, draggingNote: false })).toBe(
      "Leve o cursor até o quadro",
    );
  });

  it("describes fist, pinch and open hand", () => {
    const base = { mode: "camera" as const, trackingEnabled: true };
    expect(describeGesture({ ...base, gesture: { ...open, isFist: true }, draggingNote: false })).toBe(
      "Punho fechado: desenho pausado",
    );
    expect(describeGesture({ ...base, gesture: { ...open, isPinching: true }, draggingNote: true })).toBe(
      "Pinça: arrastando nota",
    );
    expect(describeGesture({ ...base, gesture: { ...open, isPinching: true }, draggingNote: false })).toBe(
      "Pinça: desenhando",
    );
    expect(describeGesture({ ...base, gesture: open, draggingNote: false })).toBe("Mão aberta: movendo o cursor");
  });

  it("uses press wording for the pointer", () => {
    expect(
      describeGesture({
        mode: "pointer",
        gesture: { ...open, isPinching: true },
        trackingEnabled: true,
        draggingNote: false,
      }),
    ).toBe("Pressionado: desenhando");
  });
});
