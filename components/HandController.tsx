import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandControllerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        setIsLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
        setError("Failed to load AI Vision. Check console.");
      }
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      } catch (err) {
        console.error("Camera denied:", err);
        setError("Camera permission denied.");
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;

      const startTimeMs = performance.now();
      
      // Safety check: video must have dimensions
      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
        
        const newHandData: HandData = { left: null, right: null };

        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
             // Heuristic to detect left vs right based on x coordinate? 
             // MediaPipe usually returns handedness, but we can simplify:
             // If x < 0.5 (mirrored) it's one side.
             // Actually, results.handedness tells us.
             // We need to match landmarks to handedness index.
          }
          
          // Simplified Mapping based on handedness array
          results.handedness.forEach((h, index) => {
            const landmarks = results.landmarks[index];
            const name = h[0].categoryName; // "Left" or "Right"
            
            // Calculate pinch (distance between thumb tip [4] and index tip [8])
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const distance = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2)
            );
            
            // Normalize pinch: roughly 0.02 is closed, 0.15 is open
            // Clamp 0 to 1. 0 = Open, 1 = Closed
            const pinch = Math.max(0, Math.min(1, (0.15 - distance) / 0.13));

            // Wrist is 0
            const wrist = landmarks[0];

            const handInfo = {
              x: 1 - wrist.x, // Mirror effect
              y: wrist.y,
              pinch: pinch,
              detected: true
            };

            if (name === "Left") newHandData.left = handInfo;
            if (name === "Right") newHandData.right = handInfo;
          });
        }
        
        onHandUpdate(newHandData);
      }
      
      animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
      }
      if (handLandmarker) handLandmarker.close();
      cancelAnimationFrame(animationFrameId);
    };
  }, [onHandUpdate]);

  return (
    <div className="hidden">
      {/* Video is processed but hidden from UI */}
      <video ref={videoRef} autoPlay playsInline muted style={{ width: 640, height: 480 }} />
      {error && <div className="fixed top-0 left-0 bg-red-500 text-white p-2 z-50">{error}</div>}
    </div>
  );
};

export default HandController;