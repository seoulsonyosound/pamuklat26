/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Image as ImageIcon, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { StorageService } from '@/services/storage/StorageService';
import { Photostrip } from '@/types';

// The actual page content accessing search parameters
const PreviewContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [photostrip, setPhotostrip] = useState<Photostrip | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.replace('/capture');
      return;
    }

    async function loadCapturedStrip() {
      setIsLoading(true);
      try {
        const strips = await StorageService.getPhotostrips();
        const found = strips.find((s) => s.id === id);
        
        if (found) {
          setPhotostrip(found);
          const url = URL.createObjectURL(found.imageBlob);
          activeUrlRef.current = url;
          setImageUrl(url);
        } else {
          router.replace('/capture');
        }
      } catch (err) {
        console.error('Failed to load Captured strip:', err);
        router.replace('/capture');
      } finally {
        setIsLoading(false);
      }
    }

    loadCapturedStrip();

    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, [id, router]);

  const handleDownload = () => {
    if (!imageUrl || !photostrip) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = photostrip.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRetake = async () => {
    if (!photostrip) return;
    if (confirm('Are you sure you want to delete this capture and retake photos?')) {
      setIsDeleting(true);
      try {
        await StorageService.deletePhotostrip(photostrip.id);
        router.push('/capture');
      } catch (err) {
        console.error('Failed to delete photostrip:', err);
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading captured preview...</p>
      </div>
    );
  }

  if (!photostrip || !imageUrl) return null;

  return (
    <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-8 items-center max-w-5xl mx-auto py-4">
      {/* Left side - Photostrip preview */}
      <div className="md:col-span-2 flex justify-center">
        <div className="relative w-[240px] sm:w-[280px] aspect-[1/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-white transform hover:scale-[1.01] transition-transform duration-300">
          <img
            src={imageUrl}
            alt="Captured Event Photostrip"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right side - Action Panel */}
      <div className="md:col-span-3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#FF0055] via-[#8B5CF6] to-[#00D2FF] bg-clip-text text-transparent">
            Perfect Captured!
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Your photostrip has been generated and saved locally in your browser.
            If internet is available, we will automatically sync it to the event database in the background.
          </p>
        </div>

        {/* Action Buttons Box */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-650/20 cursor-pointer border-0"
          >
            <Download className="h-5 w-5" />
            Download Photostrip
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleRetake}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-rose-455 font-semibold border border-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-4.5 w-4.5" />
              Retake
            </button>
            <button
              onClick={() => router.push('/gallery')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-indigo-400 font-semibold border border-slate-700/50 transition-all cursor-pointer"
            >
              <ImageIcon className="h-4.5 w-4.5" />
              Gallery
            </button>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="rounded-2xl bg-slate-950/40 border border-slate-900/50 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs font-bold uppercase tracking-wider">Device ID Reference</p>
              <p className="text-slate-400 text-sm font-semibold mt-0.5">{photostrip.deviceId}</p>
            </div>
            <button
              onClick={() => router.push('/capture')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all cursor-pointer"
            >
              Next Strip
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading capture workspace...</p>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
