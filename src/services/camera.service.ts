import { logger } from "@/core/system/logger";
import type { CameraSetupOptions } from "@/types/camera";

const DEFAULT_CAMERA_OPTIONS: Required<CameraSetupOptions> = {
  width: 1280,
  height: 720,
  frameRate: 30,
  facingMode: "user",
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/**
 * Returns true when the current environment supports getUserMedia.
 */
export function isCameraSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Maps a camera access error to a user-facing Portuguese message.
 */
export function resolveCameraError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Nao foi possivel acessar a camera.";
  }

  switch (error.name) {
    case "NotAllowedError":
      return "Permissao de camera negada. Libere o acesso e recarregue a pagina.";
    case "NotFoundError":
      return "Nenhuma camera foi encontrada no dispositivo.";
    case "NotReadableError":
      return "A camera esta em uso por outro aplicativo.";
    case "OverconstrainedError":
      return "As configuracoes de camera solicitadas nao sao suportadas pelo dispositivo.";
    case "AbortError":
      return "O acesso a camera foi interrompido inesperadamente.";
    default:
      return "Falha ao iniciar stream da camera.";
  }
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
 * @throws If camera is not supported or access is denied after all retries
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  options: CameraSetupOptions = {},
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error("Seu navegador nao suporta getUserMedia.");
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

      const isRetryable =
        error instanceof DOMException && retryableErrors.has(error.name);

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
