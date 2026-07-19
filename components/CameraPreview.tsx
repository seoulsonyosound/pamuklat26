'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { CameraService } from '@/services/camera/CameraService';
import { StorageService } from '@/services/storage/StorageService';

interface CameraPreviewProps {
  onStreamActive: (stream: MediaStream) => void;
  onStreamInactive: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  onStreamActive,
  onStreamInactive,
  videoRef,
}) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Store callback refs to avoid dependency cycles
  const onStreamActiveRef = useRef(onStreamActive);
  const onStreamInactiveRef = useRef(onStreamInactive);
  const videoRefStable = useRef(videoRef);

  // Keep refs in sync with latest props
  useEffect(() => { onStreamActiveRef.current = onStreamActive; }, [onStreamActive]);
  useEffect(() => { onStreamInactiveRef.current = onStreamInactive; }, [onStreamInactive]);
  useEffect(() => { videoRefStable.current = videoRef; }, [videoRef]);

  // Stops current stream — uses refs so no external dependencies
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      CameraService.stopStream(streamRef.current);
      streamRef.current = null;
      onStreamInactiveRef.current();
    }
  }, []);

  // Starts the webcam stream with selected device ID — uses refs so no external dependencies
  const startWebcam = useCallback(async (deviceId?: string | null) => {
    setIsLoading(true);
    setError(null);

    // Stop any existing stream first
    if (streamRef.current) {
      CameraService.stopStream(streamRef.current);
      streamRef.current = null;
    }

    try {
      // Use startStreamDirect for fastest possible init (no enumeration)
      const stream = await CameraService.startStreamDirect(deviceId);
      streamRef.current = stream;

      const video = videoRefStable.current?.current;
      if (video) {
        video.srcObject = stream;
        // Use 'onplaying' — fires as soon as actual frames are rendering (faster than onloadedmetadata)
        video.onplaying = () => {
          setIsLoading(false);
          onStreamActiveRef.current(stream);
          video.onplaying = null; // Only fire once
        };
        // Kick-start playback immediately
        video.play().catch(() => {});
      }
      return stream;
    } catch (err: unknown) {
      console.error(`Failed to start camera ${deviceId}:`, err);
      const msg = err instanceof Error ? err.message : 'Unknown camera error';
      setError(msg || 'Failed to start camera. Please verify permissions or connection.');
      setIsLoading(false);
      onStreamInactiveRef.current();
      return null;
    }
  }, []);

  // Initialize camera — runs ONCE on mount
  // Strategy: open the default stream AND read settings IN PARALLEL for fastest startup
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let active = true;

    async function initCamera() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fire BOTH in parallel: default stream + settings read
        const [defaultStream, settings] = await Promise.all([
          CameraService.startStreamDirect(null).catch(() => null),
          StorageService.getCameraSettings().catch(() => undefined),
        ]);
        if (!active) {
          // Cleanup if component unmounted during init
          if (defaultStream) CameraService.stopStream(defaultStream);
          return;
        }

        const savedDeviceId = settings?.selectedDeviceId || null;

        // 2. Check if we need to switch to a different saved camera
        const defaultTrack = defaultStream?.getVideoTracks()[0];
        const defaultDeviceId = defaultTrack?.getSettings()?.deviceId || '';
        const needsSwitch = savedDeviceId && savedDeviceId !== defaultDeviceId;

        let stream: MediaStream | null = null;

        if (needsSwitch && defaultStream) {
          // We have a saved device that differs from default — stop default, open saved
          CameraService.stopStream(defaultStream);
          stream = await startWebcam(savedDeviceId);
          // Fall back to default if saved device fails
          if (!stream && active) {
            stream = await startWebcam(null);
          }
        } else if (defaultStream) {
          // Default stream IS the right camera — just attach it to video
          streamRef.current = defaultStream;
          const video = videoRefStable.current?.current;
          if (video) {
            video.srcObject = defaultStream;
            video.onplaying = () => {
              setIsLoading(false);
              onStreamActiveRef.current(defaultStream);
              video.onplaying = null;
            };
            video.play().catch(() => {});
          }
          stream = defaultStream;
        } else {
          // Default stream failed — try one more time
          stream = await startWebcam(null);
        }

        if (!active || !stream) return;

        // 3. Enumerate devices in the background AFTER stream is live
        const list = await CameraService.getCameras(stream);
        if (!active) return;

        setCameras(list);

        if (list.length === 0) return;

        // Set the dropdown to the active device
        const activeTrack = stream.getVideoTracks()[0];
        const activeDeviceId = activeTrack?.getSettings()?.deviceId || '';

        if (activeDeviceId) {
          setSelectedCameraId(activeDeviceId);
        } else if (savedDeviceId) {
          setSelectedCameraId(savedDeviceId);
        } else {
          setSelectedCameraId(list[0].deviceId);
        }
      } catch (err: unknown) {
        if (!active) return;
        console.error('Camera initialization error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown camera initialization error';
        setError(msg || 'Permission denied or webcam not connected.');
        setIsLoading(false);
      }
    }

    initCamera();

    return () => {
      active = false;
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  // Handle dropdown selection
  const handleCameraChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = event.target.value;
    setSelectedCameraId(newId);
    await startWebcam(newId);
    // Save selection
    await StorageService.saveCameraSettings(newId);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      {/* Webcam Frame */}
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
            <p className="text-slate-400 text-sm font-semibold">Initializing camera stream...</p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md z-10 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">Webcam Error</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
            <button
              onClick={() => startWebcam(selectedCameraId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Camera Selection Controls */}
      {!error && cameras.length > 1 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-900 backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Camera className="h-4 w-4 text-indigo-400" />
            <span>Select Input Device</span>
          </div>
          <select
            value={selectedCameraId}
            onChange={handleCameraChange}
            disabled={isLoading}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
export default CameraPreview;

