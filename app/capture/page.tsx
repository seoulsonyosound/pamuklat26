'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RefreshCw, Sparkles } from 'lucide-react';
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
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(0);
  const [photos, setPhotos] = useState<Blob[]>([]);
  
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

        {/* Live Camera Box */}
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
          <CameraPreview
            videoRef={videoRef}
            onStreamActive={() => setIsStreamActive(true)}
            onStreamInactive={() => setIsStreamActive(false)}
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
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={startCaptureSequence}
              disabled={!isStreamActive}
              className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all shadow-xl border-0 ${
                isStreamActive
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 hover:scale-[1.02] shadow-rose-500/10 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Play className="h-5 w-5" />
              Start Capture Sequence
            </button>
            <p className="text-xs text-slate-550 text-center font-medium max-w-xs">
              This will capture 4 snapshots in a row with a 5-second countdown between each.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
