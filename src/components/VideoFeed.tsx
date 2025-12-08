// src/components/VideoFeed.tsx
import { useEffect, useRef } from "react";

interface VideoFeedProps {
    onStreamReady?: (video: HTMLVideoElement) => void;
}

export function VideoFeed({ onStreamReady }: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user"
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    onStreamReady?.(videoRef.current);
                }
            } catch (e) {
                console.error("Webcam access denied or error:", e);
                alert("Preciso de acesso à câmera para funcionar!");
            }
        }

        init();
    }, [onStreamReady]);

    return (
        <video
            ref={videoRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: -1,
                transform: "scaleX(-1)", // Mirror effect
            }}
            playsInline
            muted
        />
    );
}
