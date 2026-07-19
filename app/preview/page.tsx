/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Image as ImageIcon, Trash2, ArrowRight, Loader2, LayoutTemplate, AlertTriangle } from 'lucide-react';
import { StorageService } from '@/services/storage/StorageService';
import { CanvasService } from '@/services/CanvasService';
import { FilterSelectorBar } from '@/components/FilterSelectorBar';
import { PHOTOBOOTH_FILTERS, PhotoboothFilter, getFilterById } from '@/utils/filters';
import { Photostrip, FrameTemplate } from '@/types';

const PreviewContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [photostrip, setPhotostrip] = useState<Photostrip | null>(null);
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [frameUrls, setFrameUrls] = useState<Record<string, string>>({});
  
  const [selectedFilter, setSelectedFilter] = useState<PhotoboothFilter>(PHOTOBOOTH_FILTERS[0]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecomposing, setIsRecomposing] = useState<boolean>(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  const activeUrlRef = useRef<string | null>(null);
  const frameUrlsRef = useRef<Record<string, string>>({});

  // Load photostrip and stored frame repository
  useEffect(() => {
    if (!id) {
      router.replace('/capture');
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const [strips, storedFrames] = await Promise.all([
          StorageService.getPhotostrips(),
          StorageService.getAllFrames(),
        ]);

        const found = strips.find((s) => s.id === id);
        
        if (found) {
          setPhotostrip(found);
          setFrames(storedFrames);

          const urls: Record<string, string> = {};
          storedFrames.forEach((frame) => {
            urls[frame.id] = URL.createObjectURL(frame.imageBlob);
          });
          frameUrlsRef.current = urls;
          setFrameUrls(urls);

          const initialFilter = getFilterById(found.selectedFilterId || 'normal');
          setSelectedFilter(initialFilter);
          setSelectedFrameId(found.selectedFrameId || null);

          const url = URL.createObjectURL(found.imageBlob);
          activeUrlRef.current = url;
          setImageUrl(url);
        } else {
          router.replace('/capture');
        }
      } catch (err) {
        console.error('Failed to load captured strip data:', err);
        router.replace('/capture');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      Object.values(frameUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [id, router]);

  const recompositeStrip = useCallback(
    async (frameId: string | null, filter: PhotoboothFilter) => {
      if (!photostrip || !photostrip.rawPhotos || photostrip.rawPhotos.length !== 4) {
        return;
      }

      setIsRecomposing(true);
      try {
        const frameObj = frameId ? frames.find((f) => f.id === frameId) : null;

        const newBlob = await CanvasService.generatePhotostrip(
          photostrip.rawPhotos,
          frameObj?.imageBlob || null,
          filter.css
        );

        if (activeUrlRef.current) {
          URL.revokeObjectURL(activeUrlRef.current);
        }
        const url = URL.createObjectURL(newBlob);
        activeUrlRef.current = url;
        setImageUrl(url);

        await StorageService.updatePhotostrip(photostrip.id, newBlob, frameId, filter.id);
      } catch (err) {
        console.error('Failed to re-composite photostrip:', err);
      } finally {
        setIsRecomposing(false);
      }
    },
    [photostrip, frames]
  );

  const handleFilterSelect = (filter: PhotoboothFilter) => {
    setSelectedFilter(filter);
    recompositeStrip(selectedFrameId, filter);
  };

  const handleFrameSelect = (frameId: string | null) => {
    setSelectedFrameId(frameId);
    recompositeStrip(frameId, selectedFilter);
  };

  const handleDownload = () => {
    if (!imageUrl || !photostrip) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = photostrip.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const executeRetake = async () => {
    if (!photostrip) return;
    setIsDeleting(true);
    try {
      await StorageService.deletePhotostrip(photostrip.id);
      setIsConfirmOpen(false);
      router.push('/capture');
    } catch (err) {
      console.error('Failed to delete photostrip:', err);
      setIsDeleting(false);
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
    <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-8 items-start max-w-6xl mx-auto py-4 w-full relative">
      {/* Left Side: Real-time Composite Preview (2 Cols) */}
      <div className="md:col-span-2 flex flex-col items-center gap-3 sticky top-20">
        <div className="relative w-[240px] sm:w-[280px] aspect-[1/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 bg-white transform hover:scale-[1.01] transition-all duration-300">
          <img
            src={imageUrl}
            alt="Captured Event Photostrip"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isRecomposing ? 'opacity-50' : 'opacity-100'
            }`}
          />

          {isRecomposing && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 text-rose-500 animate-spin mb-2" />
              <span className="text-xs font-bold tracking-wider uppercase">Updating Layout...</span>
            </div>
          )}
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Real-Time Composite Preview
        </span>
      </div>

      {/* Right Side: Scrollable layout sidebar for controls (overflow-y-auto h-full) */}
      <div className="md:col-span-3 w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 overflow-y-auto h-full">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#FF0055] via-[#8B5CF6] to-[#00D2FF] bg-clip-text text-transparent">
            Perfect Captured!
          </h1>
          <p className="text-slate-700 dark:text-slate-400 text-sm mt-2">
            Customize your border layout frame and apply photobooth filters before saving or downloading your photostrip.
          </p>
        </div>

        {/* 1. Photobooth Filters Grid Card (w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible) */}
        <div className="w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible">
          <FilterSelectorBar
            activeFilterId={selectedFilter.id}
            onSelectFilter={handleFilterSelect}
            disabled={isRecomposing}
          />
        </div>

        {/* 2. Visual Border Frame Template Selection Gallery (w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible) */}
        <div className="w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-505 dark:text-slate-450">
              <LayoutTemplate className="h-3.5 w-3.5 text-indigo-505" />
              <span>Border Frame Template</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 italic">
              {frames.length} Template{frames.length !== 1 ? 's' : ''} Available
            </span>
          </div>

          {/* Horizontal visually-rendered thumbnail options (mb-6 w-full flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-thin) */}
          <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-thin py-1 mb-6 w-full">
            {/* Default SSITE Frame option */}
            <button
              type="button"
              onClick={() => handleFrameSelect(null)}
              disabled={isRecomposing}
              className={`group transition-all duration-305 flex-shrink-0 w-[90px] h-[110px] p-2 flex items-center justify-center border rounded-xl bg-white shrink-0 cursor-pointer disabled:opacity-50 ${
                selectedFrameId === null
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-355 hover:bg-slate-50 border-slate-205 dark:border-slate-800'
              }`}
            >
              {/* Silhouette preview */}
              <div className="w-12 h-20 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 flex flex-col items-center justify-center p-1 relative overflow-hidden">
                <div className="flex flex-col gap-0.5 w-full flex-1 opacity-20">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="w-full aspect-[4/3] bg-slate-600 rounded-xs" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4 text-indigo-500" />
                </div>
              </div>
            </button>

            {/* Custom Repository Frame options */}
            {frames.map((frame) => {
              const isActive = frame.id === selectedFrameId;
              const frameUrl = frameUrls[frame.id];

              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => handleFrameSelect(frame.id)}
                  disabled={isRecomposing}
                  className={`group transition-all duration-305 flex-shrink-0 w-[90px] h-[110px] p-2 flex items-center justify-center border rounded-xl bg-white shrink-0 cursor-pointer disabled:opacity-50 ${
                    isActive
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                      : 'text-slate-700 dark:text-slate-355 hover:bg-slate-50 border-slate-205 dark:border-slate-800'
                  }`}
                >
                  {/* Real transparent PNG visual overlay preview */}
                  <div className="w-12 h-20 rounded-md bg-white border border-slate-300 dark:border-slate-850 relative overflow-hidden flex items-center justify-center">
                    {frameUrl ? (
                      <img
                        src={frameUrl}
                        alt={frame.filename}
                        className="w-full h-full object-cover z-10"
                      />
                    ) : (
                      <LayoutTemplate className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Box */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isRecomposing}
            className="group/btn relative overflow-hidden bg-slate-900 dark:bg-white/5 border-0 text-white hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50 w-full h-14 flex items-center justify-center font-bold text-base rounded-xl"
          >
            <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
            <Download className="h-5 w-5 text-[#ff0055] group-hover/btn:text-[#060814] shrink-0 mr-3" />
            <span>DOWNLOAD PHOTOSTRIP</span>
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Retake Button */}
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={isRecomposing}
              className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-rose-500 dark:text-rose-400 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <Trash2 className="h-4.5 w-4.5 text-rose-500 group-hover/btn:text-[#060814] shrink-0" />
              <span>Retake</span>
            </button>
            
            {/* Gallery Button */}
            <button
              onClick={() => router.push('/gallery')}
              className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-indigo-600 dark:text-indigo-405 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <ImageIcon className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-405 group-hover/btn:text-[#060814] shrink-0" />
              <span>Gallery</span>
            </button>
          </div>
        </div>

        {/* Device ID Reference Banner */}
        <div className="rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900/50 p-4.5 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Device ID Reference</p>
              <p className="text-slate-800 dark:text-slate-200 text-sm font-bold mt-1.5 leading-none select-all">{photostrip.deviceId}</p>
            </div>
            <button
              onClick={() => router.push('/capture')}
              className="group/btn relative overflow-hidden flex items-center gap-1.5 px-4.5 py-3.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-indigo-600 dark:text-indigo-400 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <span>Next Strip</span>
              <ArrowRight className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 group-hover/btn:text-[#060814] shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center transform scale-100 transition-transform duration-300">
            <div className="mx-auto rounded-full bg-rose-500/10 p-3.5 text-rose-500 border border-rose-500/10">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Delete &amp; Retake Photos?</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                Are you sure you want to delete this capture and start a new photobooth session? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeRetake}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Yes, Retake</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
