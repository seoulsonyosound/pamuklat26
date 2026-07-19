'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

interface CameraContextType {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  getOrStartStream: (deviceId?: string | null) => Promise<MediaStream | null>;
  stopStream: () => void;
  releaseStreamForce: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const streamRef = useRef<MediaStream | null>(null);
  const activeDeviceIdRef = useRef<string | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getOrStartStream = useCallback(async (deviceId?: string | null): Promise<MediaStream | null> => {
    const targetId = deviceId || null;

    // Zero-Lag Stream Reuse: Check if active stream exists and tracks are live
    if (streamRef.current) {
      const isLive = streamRef.current.getVideoTracks().every((t) => t.readyState === 'live');
      if (isLive) {
        if (!targetId || activeDeviceIdRef.current === targetId) {
          setStream(streamRef.current);
          setIsLoading(false);
          setError(null);
          return streamRef.current;
        }
      }
    }

    // Stop previous stream if switching devices
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Media Devices API is not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: targetId ? { exact: targetId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      activeDeviceIdRef.current = targetId;

      setStream(newStream);
      setIsLoading(false);
      return newStream;
    } catch (err: unknown) {
      console.error('Failed to acquire camera stream in CameraContext:', err);
      const msg = err instanceof Error ? err.message : 'Webcam connection error';
      setError(msg || 'Failed to start camera. Please verify permissions.');
      setIsLoading(false);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    // Keep hardware warm for instant re-entry unless force released
  }, []);

  const releaseStreamForce = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
      activeDeviceIdRef.current = null;
      setStream(null);
    }
  }, []);

  // Cleanup on window unload
  useEffect(() => {
    return () => {
      releaseStreamForce();
    };
  }, [releaseStreamForce]);

  return (
    <CameraContext.Provider
      value={{
        stream,
        isLoading,
        error,
        getOrStartStream,
        stopStream,
        releaseStreamForce,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraContext = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};
