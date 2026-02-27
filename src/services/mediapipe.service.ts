import type { HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

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
