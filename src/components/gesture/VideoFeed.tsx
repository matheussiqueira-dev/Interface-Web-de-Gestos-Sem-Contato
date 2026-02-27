"use client";

import { useEffect, useRef } from "react";

import { resolveCameraError, startCamera, stopCamera } from "@/services/camera.service";

interface VideoFeedProps {
  onStreamReady?: (video: HTMLVideoElement, stream: MediaStream) => void;
  onError?: (message: string) => void;
  mirrored?: boolean;
}

export function VideoFeed({ onStreamReady, onError, mirrored = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        const stream = await startCamera(videoRef.current);
        if (!mounted) {
          stopCamera(stream);
          return;
        }

        streamRef.current = stream;
        onStreamReady?.(videoRef.current, stream);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : resolveCameraError(error));
      }
    };

    void setup();

    return () => {
      mounted = false;
      stopCamera(streamRef.current);
      streamRef.current = null;
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
