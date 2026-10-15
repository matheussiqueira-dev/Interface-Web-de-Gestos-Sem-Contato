import type { HandLandmarker } from "@mediapipe/tasks-vision";

/**
 * Must equal the installed @mediapipe/tasks-vision version: the JS bundle and
 * the WASM runtime it loads are released together. A test compares this value
 * with node_modules, so a dependency bump that forgets it fails CI.
 */
export const MEDIAPIPE_VERSION = "0.10.21";

export const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * Downloads the MediaPipe runtime and hand model and creates a landmarker.
 * Called only once a camera stream exists, so visitors who never enable the
 * camera download nothing. Tries the GPU delegate first and falls back to CPU.
 */
export async function createHandLandmarker(): Promise<HandLandmarker> {
  const tasksVision = await import("@mediapipe/tasks-vision");
  const vision = await tasksVision.FilesetResolver.forVisionTasks(WASM_BASE_URL);

  const create = async (delegate: "GPU" | "CPU") =>
    tasksVision.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_URL,
        delegate,
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

  try {
    return await create("GPU");
  } catch {
    return create("CPU");
  }
}
