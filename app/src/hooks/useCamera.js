/**
 * useCamera — Reusable camera capture hook.
 *
 * Encapsulates getUserMedia, stream lifecycle, and frame-to-File conversion.
 * Auto-cleans up the stream on unmount.
 *
 * Usage:
 *   const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } = useCamera();
 *   // Mount: <video ref={videoRef} /> and a hidden <canvas ref={canvasRef} />
 *   // Call startCamera() to begin, captureFrame() to snapshot.
 */
import { useRef, useState, useCallback, useEffect } from 'react';

export default function useCamera({
  facingMode = 'user',
  width = 1280,
  height = 720,
} = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // ── Start camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);

    // Already running — skip
    if (streamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
    } catch (err) {
      let message = 'Camera access failed.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings and reload.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found. Please connect a webcam and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is in use by another application. Close other apps using your camera.';
      }
      setError(message);
      setIsStreaming(false);
    }
  }, [facingMode, width, height]);

  // ── Stop camera ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // ── Capture a single frame as a File object ─────────────────────────────
  const captureFrame = useCallback((filename = 'capture.jpg') => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;

    const ctx = canvas.getContext('2d');

    // Mirror horizontally so the capture matches what the user sees
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset

    // Convert to Blob → File
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: 'image/jpeg' }));
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        0.92,
      );
    });
  }, []);

  // ── Auto-cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
