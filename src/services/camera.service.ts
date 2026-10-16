import { logger } from "@/core/system/logger";
import type { CameraError, CameraErrorKind, CameraSetupOptions } from "@/types/camera";

// Hand landmarks do not need HD frames; 640x360 halves decoding and inference work.
const DEFAULT_CAMERA_OPTIONS: Required<CameraSetupOptions> = {
  width: 640,
  height: 360,
  frameRate: 30,
  facingMode: "user",
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

const MESSAGES: Record<CameraErrorKind, string> = {
  denied:
    "A câmera foi bloqueada. Libere o acesso no ícone de cadeado da barra de endereço e clique em Tentar novamente.",
  "not-found": "Nenhuma câmera encontrada. Você pode usar o quadro com mouse ou toque.",
  busy: "A câmera está em uso por outro aplicativo. Feche-o e clique em Tentar novamente.",
  unsupported: "Este navegador não dá acesso à câmera. Você pode usar o quadro com mouse ou toque.",
  unknown: "Não foi possível iniciar a câmera. Tente novamente.",
};

/** Thrown when the browser has no getUserMedia (old browser or insecure origin). */
export class CameraUnsupportedError extends Error {
  constructor() {
    super(MESSAGES.unsupported);
    this.name = "CameraUnsupportedError";
  }
}

/**
 * Returns true when the current environment supports getUserMedia.
 */
export function isCameraSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

function errorName(error: unknown): string | null {
  if (error instanceof DOMException || error instanceof Error) {
    return error.name;
  }
  return null;
}

/**
 * Maps a camera failure to a kind the UI can act on and a user-facing message.
 */
export function classifyCameraError(error: unknown): CameraError {
  let kind: CameraErrorKind;
  switch (errorName(error)) {
    case "NotAllowedError":
    case "SecurityError":
      kind = "denied";
      break;
    case "NotFoundError":
    case "OverconstrainedError":
      kind = "not-found";
      break;
    case "NotReadableError":
    case "AbortError":
      kind = "busy";
      break;
    case "CameraUnsupportedError":
      kind = "unsupported";
      break;
    default:
      kind = "unknown";
  }

  return { kind, message: MESSAGES[kind] };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptStartCamera(
  videoElement: HTMLVideoElement,
  merged: Required<CameraSetupOptions>,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: merged.width },
      height: { ideal: merged.height },
      frameRate: { ideal: merged.frameRate, max: merged.frameRate },
      facingMode: merged.facingMode,
    },
  });

  videoElement.srcObject = stream;
  await videoElement.play();
  return stream;
}

/**
 * Requests camera access with the provided options and attaches the stream to
 * the given video element. Retries up to MAX_RETRIES times with a delay on
 * transient failures (NotReadableError, AbortError).
 *
 * @throws CameraUnsupportedError when getUserMedia is missing, or the last
 * getUserMedia error after all retries
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  options: CameraSetupOptions = {},
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new CameraUnsupportedError();
  }

  const merged = { ...DEFAULT_CAMERA_OPTIONS, ...options };
  const retryableErrors = new Set(["NotReadableError", "AbortError"]);

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = await attemptStartCamera(videoElement, merged);
      logger.info("Camera iniciada", {
        tracks: stream.getTracks().length,
        attempt: attempt + 1,
      });
      return stream;
    } catch (error) {
      lastError = error;

      const isRetryable = error instanceof DOMException && retryableErrors.has(error.name);

      if (!isRetryable || attempt === MAX_RETRIES) {
        break;
      }

      logger.warn(`Camera falhou (tentativa ${attempt + 1}/${MAX_RETRIES + 1}), retentando...`, {
        error: error instanceof Error ? error.message : error,
      });

      await delay(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

/**
 * Stops all tracks on the given media stream and releases the camera resource.
 */
export function stopCamera(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });

  logger.debug("Camera parada");
}
