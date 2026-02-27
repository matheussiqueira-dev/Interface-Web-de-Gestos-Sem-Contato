import { logger } from "@/core/system/logger";
import type { CameraSetupOptions } from "@/types/camera";

const DEFAULT_CAMERA_OPTIONS: Required<CameraSetupOptions> = {
  width: 1280,
  height: 720,
  frameRate: 30,
  facingMode: "user",
};

export function isCameraSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function resolveCameraError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Nao foi possivel acessar a camera.";
  }

  if (error.name === "NotAllowedError") {
    return "Permissao de camera negada. Libere o acesso e recarregue a pagina.";
  }

  if (error.name === "NotFoundError") {
    return "Nenhuma camera foi encontrada no dispositivo.";
  }

  if (error.name === "NotReadableError") {
    return "A camera esta em uso por outro aplicativo.";
  }

  return "Falha ao iniciar stream da camera.";
}

export async function startCamera(
  videoElement: HTMLVideoElement,
  options: CameraSetupOptions = {},
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error("Seu navegador nao suporta getUserMedia.");
  }

  const merged = { ...DEFAULT_CAMERA_OPTIONS, ...options };

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
  logger.info("Camera iniciada", { tracks: stream.getTracks().length });
  return stream;
}

export function stopCamera(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });

  logger.debug("Camera parada");
}
