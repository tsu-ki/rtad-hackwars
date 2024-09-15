import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

function VideoCapture({ onFrame }) {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [detector, setDetector] = useState(null);

  const setupHandDetector = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'full'
      };
      const detector = await handPoseDetection.createDetector(model, detectorConfig);
      setDetector(detector);
    } catch (error) {
      console.error('Error setting up hand detector:', error);
      setError('Failed to initialize hand detection. Please try again.');
    }
  }, []);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
          videoRef.current.oncanplay = () => {
            setIsVideoReady(true);
          };
        }
      } catch (error) {
        console.error('Error setting up camera:', error);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    }
    setupCamera().then(setupHandDetector);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupHandDetector]);

  useEffect(() => {
    if (!isVideoReady || !detector || !videoRef.current) return;

    let animationFrameId;
    const detectHands = async () => {
      const hands = await detector.estimateHands(videoRef.current);
      if (hands.length > 0) {
        const landmarks = hands[0].keypoints.map(kp => [kp.x, kp.y, kp.z]);
        onFrame(landmarks.flat());
      }
      animationFrameId = requestAnimationFrame(detectHands);
    };
    detectHands();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVideoReady, detector, onFrame]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <video 
        ref={videoRef} 
        style={{ width: '100%', height: 'auto', display: isVideoReady ? 'block' : 'none' }} 
      />
      {!isVideoReady && <div>Loading video...</div>}
    </div>
  );
}

export default VideoCapture;