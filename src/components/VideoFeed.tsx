import { useEffect, useRef } from "react";

interface VideoFeedProps {
  onStreamReady?: (video: HTMLVideoElement, stream: MediaStream) => void;
  onError?: (message: string) => void;
  mirrored?: boolean;
}

function resolveCameraError(error: unknown): string {
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

export function VideoFeed({ onStreamReady, onError, mirrored = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    async function setupCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.("Seu navegador nao suporta getUserMedia.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            frameRate: { ideal: 60, max: 60 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        onStreamReady?.(videoRef.current, stream);
      } catch (error) {
        onError?.(resolveCameraError(error));
      }
    }

    setupCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onError, onStreamReady]);

  return (
    <video
      ref={videoRef}
      className="video-feed"
      style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      autoPlay
      playsInline
      muted
      aria-hidden="true"
    />
  );
}
