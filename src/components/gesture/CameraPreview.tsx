"use client";

import { useEffect, useRef } from "react";

import { classifyCameraError, startCamera, stopCamera } from "@/services/camera.service";
import type { CameraError } from "@/types/camera";
import type { HandLandmark } from "@/types/tracking";

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

interface CameraPreviewProps {
  landmarks: HandLandmark[] | null;
  pinching: boolean;
  onReady: (video: HTMLVideoElement) => void;
  onError: (error: CameraError) => void;
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Mirrored camera thumbnail with the detected hand drawn over it (A.7 §17):
 * landmarks in --ms-text over a dark halo so they read on any frame, and the
 * thumb-index segment in the accent while a pinch is active.
 */
export function CameraPreview({ landmarks, pinching, onReady, onError }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    let mounted = true;
    let stream: MediaStream | null = null;

    startCamera(video)
      .then((started) => {
        if (!mounted) {
          stopCamera(started);
          return;
        }
        stream = started;
        onReady(video);
      })
      .catch((error: unknown) => {
        if (mounted) {
          onError(classifyCameraError(error));
        }
      });

    return () => {
      mounted = false;
      stopCamera(stream);
    };
  }, [onError, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !video || !context) {
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.clearRect(0, 0, width, height);
    if (!landmarks || landmarks.length < 21) {
      return;
    }

    const point = (index: number) => [landmarks[index].x * width, landmarks[index].y * height] as const;
    const stroke = (from: number, to: number, color: string, lineWidth: number) => {
      const [x1, y1] = point(from);
      const [x2, y2] = point(to);
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    };

    const text = readToken("--ms-text");
    const halo = readToken("--ms-media-halo");
    const accent = readToken("--ms-accent");
    const scale = width / 640;
    context.lineCap = "round";

    for (const [from, to] of HAND_CONNECTIONS) {
      stroke(from, to, halo, 6 * scale);
    }
    for (const [from, to] of HAND_CONNECTIONS) {
      stroke(from, to, text, 3 * scale);
    }
    if (pinching) {
      stroke(4, 8, halo, 8 * scale);
      stroke(4, 8, accent, 4 * scale);
    }
    for (let index = 0; index < landmarks.length; index++) {
      const [x, y] = point(index);
      context.fillStyle = halo;
      context.beginPath();
      context.arc(x, y, 5 * scale, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = pinching && (index === 4 || index === 8) ? accent : text;
      context.beginPath();
      context.arc(x, y, 3 * scale, 0, Math.PI * 2);
      context.fill();
    }
  }, [landmarks, pinching]);

  return (
    <figure className="camera-preview">
      <video ref={videoRef} className="camera-preview__media" autoPlay playsInline muted aria-hidden="true" />
      <canvas ref={canvasRef} className="camera-preview__media" aria-hidden="true" />
      <figcaption className="ms-sr-only">Imagem da câmera, espelhada, com a mão detectada desenhada por cima.</figcaption>
    </figure>
  );
}
