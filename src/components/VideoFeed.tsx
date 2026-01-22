// src/components/VideoFeed.tsx
import { useEffect, useRef } from "react";

interface VideoFeedProps {
    onStreamReady?: (video: HTMLVideoElement, stream: MediaStream) => void;
    onError?: (message: string) => void;
    mirrored?: boolean;
}

export function VideoFeed({ onStreamReady, onError, mirrored = true }: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        let isMounted = true;
        let stream: MediaStream | null = null;

        async function init() {
            if (!navigator.mediaDevices?.getUserMedia) {
                onError?.("Seu navegador não oferece acesso à câmera.");
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user",
                    },
                });

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    onStreamReady?.(videoRef.current, stream);
                }
            } catch (e) {
                console.error("Webcam access denied or error:", e);
                onError?.("Permissão da câmera negada ou indisponível.");
            }
        }

        init();

        return () => {
            isMounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onStreamReady, onError]);

    return (
        <video
            ref={videoRef}
            className="video-feed"
            style={{
                transform: mirrored ? "scaleX(-1)" : undefined,
            }}
            playsInline
            muted
        />
    );
}
