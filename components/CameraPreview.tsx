'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCameraContext } from '@/context/CameraContext';
import { CameraService } from '@/services/camera/CameraService';
import { StorageService } from '@/services/storage/StorageService';

interface CameraPreviewProps {
  onStreamActive: (stream: MediaStream) => void;
  onStreamInactive: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activeFilterCss?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  onStreamActive,
  onStreamInactive,
  videoRef,
  activeFilterCss = 'none',
}) => {
  const { stream: globalStream, isLoading: isContextLoading, error: contextError, isMirrored, getOrStartStream, stopStream } = useCameraContext();

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isInitializedRef = useRef<boolean>(false);

  // Store callback refs to avoid dependency cycles
  const onStreamActiveRef = useRef(onStreamActive);
  const onStreamInactiveRef = useRef(onStreamInactive);
  const videoRefStable = useRef(videoRef);

  useEffect(() => { onStreamActiveRef.current = onStreamActive; }, [onStreamActive]);
  useEffect(() => { onStreamInactiveRef.current = onStreamInactive; }, [onStreamInactive]);
  useEffect(() => { videoRefStable.current = videoRef; }, [videoRef]);

  // Bind media stream to HTMLVideoElement instantly
  const bindStreamToVideo = useCallback((activeStream: MediaStream) => {
    const video = videoRefStable.current?.current;
    if (video) {
      video.srcObject = activeStream;

      if (video.readyState >= 2) {
        setIsLoading(false);
        onStreamActiveRef.current(activeStream);
      } else {
        video.onplaying = () => {
          setIsLoading(false);
          onStreamActiveRef.current(activeStream);
          video.onplaying = null;
        };
      }

      video.play().catch(() => {});
    }
  }, []);

  // Initialize camera stream via CameraContext
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let active = true;

    async function initCamera() {
      setIsLoading(true);
      setError(null);

      try {
        // Read saved camera settings
        const settings = await StorageService.getCameraSettings().catch(() => undefined);
        const savedId = settings?.selectedDeviceId || null;

        // Acquire persistent zero-lag stream from CameraContext
        const activeStream = await getOrStartStream(savedId);

        if (!active || !activeStream) {
          if (active) {
            setError(contextError || 'Webcam initialization failed.');
            setIsLoading(false);
            onStreamInactiveRef.current();
          }
          return;
        }

        bindStreamToVideo(activeStream);

        // Enumerate camera devices in background
        const list = await CameraService.getCameras(activeStream);
        if (!active) return;

        setCameras(list);
        if (list.length > 0) {
          const track = activeStream.getVideoTracks()[0];
          const activeId = track?.getSettings()?.deviceId || savedId || list[0].deviceId;
          setSelectedCameraId(activeId);
        }
      } catch (err: unknown) {
        if (!active) return;
        console.error('Camera initialization error:', err);
        const msg = err instanceof Error ? err.message : 'Camera error';
        setError(msg || 'Webcam permission denied or not connected.');
        setIsLoading(false);
        onStreamInactiveRef.current();
      }
    }

    initCamera();

    return () => {
      active = false;
      stopStream();
    };
  }, [getOrStartStream, stopStream, bindStreamToVideo, contextError]);

  // Fast re-bind if global stream is already live (e.g. returning to /capture via Retake or Next Strip)
  useEffect(() => {
    if (globalStream && videoRefStable.current?.current) {
      bindStreamToVideo(globalStream);
    }
  }, [globalStream, bindStreamToVideo]);

  // Handle dropdown camera device selection
  const handleCameraChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = event.target.value;
    setSelectedCameraId(newId);
    setIsLoading(true);
    
    const newStream = await getOrStartStream(newId);
    if (newStream) {
      bindStreamToVideo(newStream);
      await StorageService.saveCameraSettings(newId);
    } else {
      setIsLoading(false);
    }
  };

  const displayLoading = isLoading || isContextLoading;
  const displayError = error || contextError;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      {/* Webcam Frame */}
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            filter: activeFilterCss,
            transform: isMirrored ? 'scaleX(-1)' : 'none'
          }}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Loading Overlay */}
        {displayLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
            <RefreshCw className="h-10 w-10 text-rose-500 animate-spin mb-3" />
            <p className="text-slate-400 text-sm font-semibold">Connecting camera stream...</p>
          </div>
        )}

        {/* Error Overlay */}
        {displayError && !displayLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md z-10 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">Webcam Error</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">{displayError}</p>
            <button
              onClick={() => getOrStartStream(selectedCameraId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        )}
      </div>


    </div>
  );
};
export default CameraPreview;
