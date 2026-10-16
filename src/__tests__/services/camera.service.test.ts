import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CameraUnsupportedError,
  classifyCameraError,
  isCameraSupported,
  startCamera,
  stopCamera,
} from "@/services/camera.service";

function domError(name: string): DOMException {
  return new DOMException("camera failure", name);
}

function makeStream() {
  const stop = vi.fn();
  return { stream: { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream, stop };
}

function makeVideo() {
  return { srcObject: null, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLVideoElement;
}

function setMediaDevices(value: unknown) {
  Object.defineProperty(navigator, "mediaDevices", { value, configurable: true });
}

describe("camera.service", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setMediaDevices(undefined);
  });

  describe("isCameraSupported", () => {
    it("reflects the presence of getUserMedia", () => {
      setMediaDevices(undefined);
      expect(isCameraSupported()).toBe(false);
      setMediaDevices({ getUserMedia: vi.fn() });
      expect(isCameraSupported()).toBe(true);
    });
  });

  describe("classifyCameraError", () => {
    it.each([
      ["NotAllowedError", "denied"],
      ["SecurityError", "denied"],
      ["NotFoundError", "not-found"],
      ["OverconstrainedError", "not-found"],
      ["NotReadableError", "busy"],
      ["AbortError", "busy"],
      ["SomethingElse", "unknown"],
    ])("maps %s to %s", (name, kind) => {
      const result = classifyCameraError(domError(name));
      expect(result.kind).toBe(kind);
      expect(result.message.length).toBeGreaterThan(10);
    });

    it("recognises unsupported browsers and non-error values", () => {
      expect(classifyCameraError(new CameraUnsupportedError()).kind).toBe("unsupported");
      expect(classifyCameraError("boom").kind).toBe("unknown");
    });
  });

  describe("startCamera", () => {
    it("throws CameraUnsupportedError without getUserMedia", async () => {
      setMediaDevices(undefined);
      await expect(startCamera(makeVideo())).rejects.toBeInstanceOf(CameraUnsupportedError);
    });

    it("attaches the stream, plays the video and requests 640x360 by default", async () => {
      const { stream } = makeStream();
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      setMediaDevices({ getUserMedia });
      const video = makeVideo();

      await expect(startCamera(video)).resolves.toBe(stream);
      expect(video.srcObject).toBe(stream);
      expect(video.play).toHaveBeenCalledOnce();
      expect(getUserMedia.mock.calls[0][0].video.width).toEqual({ ideal: 640 });
    });

    it("does not retry a denied permission", async () => {
      const getUserMedia = vi.fn().mockRejectedValue(domError("NotAllowedError"));
      setMediaDevices({ getUserMedia });

      await expect(startCamera(makeVideo())).rejects.toMatchObject({ name: "NotAllowedError" });
      expect(getUserMedia).toHaveBeenCalledOnce();
    });

    it("retries a busy camera and succeeds", async () => {
      vi.useFakeTimers();
      const { stream } = makeStream();
      const getUserMedia = vi
        .fn()
        .mockRejectedValueOnce(domError("NotReadableError"))
        .mockResolvedValueOnce(stream);
      setMediaDevices({ getUserMedia });

      const pending = startCamera(makeVideo());
      await vi.advanceTimersByTimeAsync(800);
      await expect(pending).resolves.toBe(stream);
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    it("gives up after the last retry", async () => {
      vi.useFakeTimers();
      const getUserMedia = vi.fn().mockRejectedValue(domError("AbortError"));
      setMediaDevices({ getUserMedia });

      const pending = startCamera(makeVideo());
      const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
      await vi.advanceTimersByTimeAsync(1600);
      await assertion;
      expect(getUserMedia).toHaveBeenCalledTimes(3);
    });
  });

  describe("stopCamera", () => {
    it("ignores a null stream and stops every track otherwise", () => {
      expect(() => stopCamera(null)).not.toThrow();
      const { stream, stop } = makeStream();
      stopCamera(stream);
      expect(stop).toHaveBeenCalledTimes(2);
    });
  });
});
