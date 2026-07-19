'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RefreshCw, Sparkles, ImageIcon } from 'lucide-react';
import { CameraPreview } from '@/components/CameraPreview';
import { Countdown } from '@/components/Countdown';
import { CaptureProgress } from '@/components/CaptureProgress';
import { FlashAnimation } from '@/components/FlashAnimation';
import { CameraService } from '@/services/camera/CameraService';
import { CanvasService } from '@/services/CanvasService';
import { StorageService } from '@/services/storage/StorageService';

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // States
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);

  // Stable callbacks to avoid re-triggering camera initialization
  const handleStreamActive = useCallback(() => setIsStreamActive(true), []);
  const handleStreamInactive = useCallback(() => setIsStreamActive(false), []);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(0);
  const [photos, setPhotos] = useState<Blob[]>([]);
  
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Create object URLs from photo blobs for thumbnail display
  const photoUrls = useMemo(() => photos.map((blob) => URL.createObjectURL(blob)), [photos]);

  // Revoke old object URLs on change to prevent memory leaks
  useEffect(() => {
    return () => {
      photoUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoUrls]);

  const resetState = useCallback(() => {
    setIsCapturing(false);
    setIsProcessing(false);
    setPhotos([]);
    setCurrentStep(1);
    setCountdown(0);
  }, []);

  const compilePhotostrip = useCallback(async (allPhotos: Blob[]) => {
    setIsCapturing(false);
    setIsProcessing(true);

    try {
      // 1. Retrieve custom transparent frame blob if uploaded
      const frameTemplate = await StorageService.getFrame();
      
      // 2. Merge 4 photos vertically and overlay frame
      const stripBlob = await CanvasService.generatePhotostrip(
        allPhotos,
        frameTemplate?.imageBlob || null
      );

      // 3. Save locally to IndexedDB & trigger SyncService
      const savedStrip = await StorageService.savePhotostrip(stripBlob);

      // 4. Redirect to the Preview Screen
      router.push(`/preview?id=${savedStrip.id}`);
    } catch (error) {
      console.error('Compilation failed:', error);
      alert('Failed to assemble the vertical photostrip.');
      resetState();
    }
  }, [router, resetState]);

  const triggerCapture = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      // 1. Play synthesized camera shutter sound (Web Audio)
      CameraService.playShutterSound();

      // 2. Play white flash animation
      setIsFlashing(true);

      // 3. Take canvas photo snapshot
      const photoBlob = await CameraService.takePhoto(videoRef.current);
      const nextPhotos = [...photos, photoBlob];
      setPhotos(nextPhotos);

      if (nextPhotos.length < 4) {
        // Move to the next capture stage
        setCurrentStep((prev) => prev + 1);
        setCountdown(5);
      } else {
        // All 4 photos captured, compile photostrip
        await compilePhotostrip(nextPhotos);
      }
    } catch (error) {
      console.error('Capture sequence error:', error);
      alert('Photo capture failed. Resetting photobooth.');
      resetState();
    }
  }, [photos, compilePhotostrip, resetState]);

  // Countdown timer loop
  useEffect(() => {
    if (!isCapturing || isProcessing) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Take snapshot!
      triggerCapture();
    }
  }, [isCapturing, countdown, isProcessing, triggerCapture]);

  const startCaptureSequence = () => {
    if (!isStreamActive || isCapturing || isProcessing) return;

    setPhotos([]);
    setCurrentStep(1);
    setCountdown(5);
    setIsCapturing(true);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-4 relative">
      {/* Processing Loader Block */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-3xl">
          <div className="relative flex items-center justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-rose-500 animate-spin" />
            <Sparkles className="absolute h-5 w-5 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Composing Photostrip</h2>
          <p className="text-slate-550 text-sm max-w-xs text-center">
            Merging 4 snapshots vertically and applying frame layout...
          </p>
        </div>
      )}

      {/* Main Grid View */}
      <div className="w-full flex flex-col gap-6 items-center">
        {/* Progress Tracker when capturing */}
        {isCapturing && (
          <div className="w-full max-w-3xl flex justify-center py-2">
            <CaptureProgress currentStep={currentStep} totalSteps={4} />
          </div>
        )}

        {/* Captured Photos Thumbnails — shown above the camera */}
        {photos.length > 0 && (
          <div className="w-full max-w-3xl">
            <div className="flex items-center gap-2 mb-3 px-1">
              <ImageIcon className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Captured ({photos.length} / 4)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all duration-500 ${
                    idx < photos.length
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-100 opacity-100'
                      : 'border-slate-800 bg-slate-900/50 scale-95 opacity-40'
                  }`}
                >
                  {idx < photos.length ? (
                    <img
                      src={photoUrls[idx]}
                      alt={`Capture ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-600 text-xs font-bold">{idx + 1}</span>
                    </div>
                  )}
                  {/* Step badge */}
                  <div
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      idx < photos.length
                        ? 'bg-indigo-500/90 text-white'
                        : 'bg-slate-800/80 text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Camera Box */}
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
          <CameraPreview
            videoRef={videoRef}
            onStreamActive={handleStreamActive}
            onStreamInactive={handleStreamInactive}
          />

          {/* Shutter Flash Animation overlay */}
          <FlashAnimation
            isFlashing={isFlashing}
            onFlashComplete={() => setIsFlashing(false)}
          />

          {/* Countdown Clock overlay */}
          <Countdown count={countdown} />
        </div>

        {/* Capture Control Button */}
        {!isCapturing && !isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={startCaptureSequence}
              disabled={!isStreamActive}
              className={`group/btn relative overflow-hidden flex items-center gap-3 px-10 py-5 rounded-none font-black text-sm tracking-[0.15em] border-0 transition-all duration-300 ease-out z-10 ${
                isStreamActive
                  ? 'bg-transparent text-white hover:text-[#060814] hover:-translate-y-1 active:translate-y-0 cursor-pointer shadow-lg shadow-white/[0.02]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {/* White slide background overlay on hover (only active if stream active) */}
              {isStreamActive && (
                <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              )}
              <Play className={`h-5 w-5 transition-transform duration-300 ${
                isStreamActive ? 'text-[#ff0055] group-hover/btn:rotate-12 group-hover/btn:text-[#060814]' : 'text-white/10'
              }`} />
              <span>START CAPTURE SEQUENCE</span>
            </button>
            <p className="text-xs text-white/30 text-center font-medium max-w-xs leading-relaxed">
              This will capture 4 snapshots in a row with a 5-second countdown between each.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
