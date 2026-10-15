import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHandTracking } from "@/hooks/useHandTracking";
import { buildHandLandmarks } from "@/lib/demo/simulatedHand";

const createHandLandmarker = vi.fn();

vi.mock("@/services/mediapipe.service", () => ({
  createHandLandmarker: () => createHandLandmarker(),
}));

function makeVideo() {
  let time = 0;
  return {
    readyState: 4,
    get currentTime() {
      time += 0.033;
      return time;
    },
  } as unknown as HTMLVideoElement;
}

function makeLandmarker(hands: Array<ReturnType<typeof buildHandLandmarks> | null>) {
  let call = 0;
  return {
    detectForVideo: vi.fn(() => {
      const hand = hands[Math.min(call++, hands.length - 1)];
      return { landmarks: hand ? [hand] : [] };
    }),
    close: vi.fn(),
  };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useHandTracking", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "performance"] });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    createHandLandmarker.mockReset();
  });

  it("does not download the model before a camera stream exists", () => {
    const { result } = renderHook(() => useHandTracking(null, true));
    expect(result.current.status).toBe("idle");
    expect(createHandLandmarker).not.toHaveBeenCalled();
  });

  it("loads the model, then streams landmarks from the video", async () => {
    const hand = buildHandLandmarks({ x: 0.5, y: 0.4 }, 0);
    const landmarker = makeLandmarker([hand]);
    createHandLandmarker.mockResolvedValue(landmarker);

    const { result } = renderHook(() => useHandTracking(makeVideo(), true, 30));
    expect(result.current.status).toBe("loading");

    await flushPromises();
    expect(result.current.status).toBe("ready");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(landmarker.detectForVideo).toHaveBeenCalled();
    expect(result.current.landmarks).toEqual(hand);
  });

  it("clears landmarks when the hand leaves the frame", async () => {
    const landmarker = makeLandmarker([buildHandLandmarks({ x: 0.5, y: 0.4 }, 0), null]);
    createHandLandmarker.mockResolvedValue(landmarker);

    const { result } = renderHook(() => useHandTracking(makeVideo(), true, 30));
    await flushPromises();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.landmarks).toBeNull();
  });

  it("reports a model loading failure", async () => {
    createHandLandmarker.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useHandTracking(makeVideo(), true));
    await flushPromises();
    expect(result.current).toMatchObject({ status: "error", error: "network down" });
  });

  it("closes the model and resets when tracking is turned off", async () => {
    const landmarker = makeLandmarker([buildHandLandmarks({ x: 0.5, y: 0.4 }, 0)]);
    createHandLandmarker.mockResolvedValue(landmarker);
    const video = makeVideo();

    const { result, rerender } = renderHook(({ on }: { on: boolean }) => useHandTracking(video, on), {
      initialProps: { on: true },
    });
    await flushPromises();
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ on: false });
    expect(landmarker.close).toHaveBeenCalled();
    expect(result.current).toMatchObject({ status: "idle", landmarks: null });
  });

  it("drops landmarks while the page is hidden", async () => {
    createHandLandmarker.mockResolvedValue(makeLandmarker([buildHandLandmarks({ x: 0.5, y: 0.4 }, 0)]));
    const { result } = renderHook(() => useHandTracking(makeVideo(), true));
    await flushPromises();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.landmarks).not.toBeNull();

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.landmarks).toBeNull();
    hidden.mockRestore();
  });
});
