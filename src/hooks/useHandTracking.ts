import { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { HandTrackingResult } from '../types';

export const useHandTracking = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handData, setHandData] = useState<HandTrackingResult | null>(null);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe Hand Landmarker
  const initializeHandLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handLandmarkerRef.current = handLandmarker;
      setIsReady(true);
    } catch (err) {
      setError(`Failed to initialize hand tracking: ${err}`);
      console.error('Hand tracking initialization error:', err);
    }
  }, []);

  // Start camera and video stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;

      // Create video element if it doesn't exist
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        videoRef.current = video;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      setError(`Failed to access camera: ${err}`);
      console.error('Camera access error:', err);
    }
  }, []);

  // Process video frame
  const processFrame = useCallback(() => {
    if (!handLandmarkerRef.current || !videoRef.current || !isReady) {
      return;
    }

    const video = videoRef.current;
    const currentTime = video.currentTime;

    // Only process if we have a new frame
    if (currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = currentTime;

      try {
        const results: HandLandmarkerResult = handLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0].map((landmark) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z
          }));

          const handedness = results.handednesses?.[0]?.[0]?.categoryName || 'Unknown';

          setHandData({
            landmarks,
            handedness
          });
        } else {
          setHandData(null);
        }
      } catch (err) {
        console.error('Frame processing error:', err);
      }
    }

    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isReady]);

  // Start tracking
  const startTracking = useCallback(async () => {
    await initializeHandLandmarker();
    await startCamera();
    
    // Start processing frames
    if (animationFrameRef.current === null) {
      processFrame();
    }
  }, [initializeHandLandmarker, startCamera, processFrame]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHandData(null);
    setIsReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [stopTracking]);

  return {
    isReady,
    error,
    handData,
    startTracking,
    stopTracking,
    videoElement: videoRef.current
  };
};
