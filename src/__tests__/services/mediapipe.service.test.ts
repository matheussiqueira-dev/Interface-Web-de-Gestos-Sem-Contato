import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const forVisionTasks = vi.fn();
const createFromOptions = vi.fn();

vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks },
  HandLandmarker: { createFromOptions },
}));

import {
  createHandLandmarker,
  MEDIAPIPE_VERSION,
  WASM_BASE_URL,
} from "@/services/mediapipe.service";

describe("mediapipe.service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the WASM runtime of the installed tasks-vision version", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "node_modules/@mediapipe/tasks-vision/package.json"), "utf8"),
    ) as { version: string };
    expect(MEDIAPIPE_VERSION).toBe(manifest.version);
    expect(WASM_BASE_URL).toContain(`@${manifest.version}/wasm`);
  });

  it("creates a single-hand VIDEO landmarker on the GPU", async () => {
    const landmarker = { close: vi.fn() };
    forVisionTasks.mockResolvedValue("fileset");
    createFromOptions.mockResolvedValue(landmarker);

    await expect(createHandLandmarker()).resolves.toBe(landmarker);
    expect(forVisionTasks).toHaveBeenCalledWith(WASM_BASE_URL);
    expect(createFromOptions).toHaveBeenCalledWith(
      "fileset",
      expect.objectContaining({
        runningMode: "VIDEO",
        numHands: 1,
        baseOptions: expect.objectContaining({ delegate: "GPU" }),
      }),
    );
  });

  it("falls back to the CPU delegate when the GPU fails", async () => {
    const landmarker = { close: vi.fn() };
    forVisionTasks.mockResolvedValue("fileset");
    createFromOptions.mockRejectedValueOnce(new Error("no webgl")).mockResolvedValueOnce(landmarker);

    await expect(createHandLandmarker()).resolves.toBe(landmarker);
    expect(createFromOptions).toHaveBeenLastCalledWith(
      "fileset",
      expect.objectContaining({ baseOptions: expect.objectContaining({ delegate: "CPU" }) }),
    );
  });
});
