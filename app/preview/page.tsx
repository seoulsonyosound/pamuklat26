/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Image as ImageIcon, Trash2, ArrowRight, Loader2, LayoutTemplate, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { StorageService } from '@/services/storage/StorageService';
import { SupabaseService } from '@/services/supabase/SupabaseService';
import { IndexedDBService } from '@/services/storage/IndexedDBService';
import { CanvasService } from '@/services/CanvasService';
import { FilterSelectorBar } from '@/components/FilterSelectorBar';
import { StickerPickerDrawer } from '@/components/StickerStudio/StickerPickerDrawer';
import { InteractiveStickerOverlay, PlacedPreviewSticker } from '@/components/StickerStudio/InteractiveStickerOverlay';
import { PHOTOBOOTH_FILTERS, PhotoboothFilter, getFilterById } from '@/utils/filters';
import { StickerItem } from '@/utils/stickers';
import { Photostrip, FrameTemplate } from '@/types';

const PreviewContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const photostrip = useLiveQuery(
    async () => {
      if (!db || !id) return null;
      return (await db.photostrips.get(id)) || null;
    },
    [id]
  );

  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [frameUrls, setFrameUrls] = useState<Record<string, string>>({});
  
  const [selectedFilter, setSelectedFilter] = useState<PhotoboothFilter>(PHOTOBOOTH_FILTERS[0]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stickers, setStickers] = useState<PlacedPreviewSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecomposing, setIsRecomposing] = useState<boolean>(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const activeUrlRef = useRef<string | null>(null);
  const frameUrlsRef = useRef<Record<string, string>>({});

  // Load background frame templates once on mount
  useEffect(() => {
    async function loadFrames() {
      setIsLoading(true);
      try {
        const storedFrames = await StorageService.getAllFrames();
        setFrames(storedFrames);

        const urls: Record<string, string> = {};
        storedFrames.forEach((frame) => {
          urls[frame.id] = URL.createObjectURL(frame.imageBlob);
        });
        frameUrlsRef.current = urls;
        setFrameUrls(urls);
      } catch (err) {
        console.error('Failed to load frame templates:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFrames();

    return () => {
      Object.values(frameUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Reactively track changes to the photostrip record
  useEffect(() => {
    if (photostrip) {
      const url = URL.createObjectURL(photostrip.imageBlob);
      const prevUrl = activeUrlRef.current;
      activeUrlRef.current = url;
      setImageUrl(url);
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }

      if (!hasInitializedRef.current) {
        const initialFilter = getFilterById(photostrip.selectedFilterId || 'normal');
        setSelectedFilter(initialFilter);
        setSelectedFrameId(photostrip.selectedFrameId || null);
        hasInitializedRef.current = true;
      }
    } else if (photostrip === null) {
      // Redirect if not found
      router.replace('/capture');
    }
  }, [photostrip, router]);

  // Clean up main preview URL on unmount
  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);


  const recompositeStrip = useCallback(
    async (
      frameId: string | null,
      filter: PhotoboothFilter,
      currentStickers: PlacedPreviewSticker[] = stickers
    ) => {
      if (!photostrip || !photostrip.rawPhotos || photostrip.rawPhotos.length !== 4) {
        return;
      }

      setIsRecomposing(true);
      try {
        const frameObj = frameId ? frames.find((f) => f.id === frameId) : null;

        const newBlob = await CanvasService.generatePhotostrip(
          photostrip.rawPhotos,
          frameObj?.imageBlob || null,
          filter.css,
          currentStickers
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
    [photostrip, frames, stickers]
  );

  const handleFilterSelect = (filter: PhotoboothFilter) => {
    setSelectedFilter(filter);
    recompositeStrip(selectedFrameId, filter, stickers);
  };

  const handleFrameSelect = (frameId: string | null) => {
    setSelectedFrameId(frameId);
    recompositeStrip(frameId, selectedFilter, stickers);
  };

  const handleAddSticker = (item: StickerItem) => {
    const newSticker: PlacedPreviewSticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: item.url,
      x: 105, // center x relative to 280px container
      y: 385, // center y relative to 840px container
      width: 70,
      height: 70,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const handleUpdateSticker = (updated: PlacedPreviewSticker) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
  };

  const handleClearStickers = () => {
    setStickers([]);
    setSelectedStickerId(null);
  };

  /**
   * Upload the current local blob (with applied frame+filter+stickers) to Supabase.
   * Called before Download and Gallery so the cloud version is always up to date.
   */
  const uploadCurrentState = useCallback(async (strip: Photostrip) => {
    try {
      let finalStrip = strip;
      if (strip.rawPhotos && strip.rawPhotos.length === 4) {
        const frameObj = selectedFrameId ? frames.find((f) => f.id === selectedFrameId) : null;
        const bakedBlob = await CanvasService.generatePhotostrip(
          strip.rawPhotos,
          frameObj?.imageBlob || null,
          selectedFilter.css,
          stickers
        );
        await StorageService.updatePhotostrip(strip.id, bakedBlob, selectedFrameId, selectedFilter.id);
        finalStrip = { ...strip, imageBlob: bakedBlob };
      }
      await SupabaseService.uploadPhotostrip(finalStrip);
      await IndexedDBService.markAsSynced(strip.id, new Date());
    } catch (err) {
      console.warn('Failed to upload photostrip to cloud (will retry later):', err);
    }
  }, [stickers, selectedFrameId, selectedFilter, frames]);

  const handleDownload = async () => {
    if (!photostrip) return;
    setIsUploading(true);
    let downloadUrl = imageUrl;
    try {
      if (photostrip.rawPhotos && photostrip.rawPhotos.length === 4) {
        const frameObj = selectedFrameId ? frames.find((f) => f.id === selectedFrameId) : null;
        const bakedBlob = await CanvasService.generatePhotostrip(
          photostrip.rawPhotos,
          frameObj?.imageBlob || null,
          selectedFilter.css,
          stickers
        );
        downloadUrl = URL.createObjectURL(bakedBlob);
        await StorageService.updatePhotostrip(photostrip.id, bakedBlob, selectedFrameId, selectedFilter.id);
        const updatedStrip = { ...photostrip, imageBlob: bakedBlob };
        await SupabaseService.uploadPhotostrip(updatedStrip);
        await IndexedDBService.markAsSynced(photostrip.id, new Date());
      } else {
        await uploadCurrentState(photostrip);
      }
    } catch (err) {
      console.error('Failed to prepare download:', err);
    } finally {
      setIsUploading(false);
    }

    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = photostrip.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleGoToGallery = async () => {
    if (!photostrip) { router.push('/gallery'); return; }
    setIsUploading(true);
    try {
      await uploadCurrentState(photostrip);
    } finally {
      setIsUploading(false);
    }
    router.push('/gallery');
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
      <div className="md:col-span-2 flex flex-col items-center gap-3 md:sticky md:top-20">
        <div className="relative w-[240px] sm:w-[280px] aspect-[1/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 bg-white transform hover:scale-[1.01] transition-all duration-300">
          <img
            src={imageUrl}
            alt="Captured Event Photostrip"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isRecomposing ? 'opacity-50' : 'opacity-100'
            }`}
          />

          {/* Interactive Drag, Resize & Rotate Sticker Overlay */}
          <InteractiveStickerOverlay
            stickers={stickers}
            selectedId={selectedStickerId}
            onSelectSticker={setSelectedStickerId}
            onChangeSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
            containerWidth={280}
            containerHeight={840}
          />

          {isRecomposing && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
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
      <div className="md:col-span-3 w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 md:overflow-y-auto md:h-full">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#FF0055] via-[#8B5CF6] to-[#00D2FF] bg-clip-text text-transparent">
            Perfect Captured!
          </h1>
          <p className="text-slate-700 dark:text-slate-400 text-sm mt-2">
            Customize your border layout frame and apply photobooth filters before saving or downloading your photostrip.
          </p>
        </div>

        {/* 1. Photobooth Filters Grid Card (w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible) */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible shadow-sm">
          <FilterSelectorBar
            activeFilterId={selectedFilter.id}
            onSelectFilter={handleFilterSelect}
            disabled={isRecomposing}
          />
        </div>

        {/* 2. Visual Border Frame Template Selection Gallery (w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible) */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-auto block clear-both overflow-visible shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <LayoutTemplate className="h-3.5 w-3.5 text-indigo-500" />
              <span>Border Frame Template</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 italic">
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
              className={`group transition-all duration-305 flex-shrink-0 w-[90px] h-[110px] p-2 flex items-center justify-center border rounded-xl bg-white dark:bg-slate-950/40 shrink-0 cursor-pointer disabled:opacity-50 ${
                selectedFrameId === null
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
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
                  className={`group transition-all duration-305 flex-shrink-0 w-[90px] h-[110px] p-2 flex items-center justify-center border rounded-xl bg-white dark:bg-slate-950/40 shrink-0 cursor-pointer disabled:opacity-50 ${
                    isActive
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
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

        {/* 3. Sticker & Prop Selection Library */}
        <div className="flex flex-col gap-2">
          {stickers.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearStickers}
                disabled={isRecomposing}
                type="button"
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear Added Props ({stickers.length})
              </button>
            </div>
          )}
          <StickerPickerDrawer onAddSticker={handleAddSticker} />
        </div>

        {/* Action Buttons Box */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3">
          {/* Download Button — uploads to Supabase first, then triggers browser download */}
          <button
            onClick={handleDownload}
            disabled={isRecomposing || isUploading}
            className="group/btn relative overflow-hidden bg-slate-900 dark:bg-white/5 border-0 text-white hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50 w-full h-14 flex items-center justify-center font-bold text-base rounded-xl"
          >
            <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 shrink-0 mr-3 animate-spin" />
                <span>SAVING TO CLOUD...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 text-[#ff0055] group-hover/btn:text-[#060814] shrink-0 mr-3" />
                <span>DOWNLOAD</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Retake Button — no upload, just delete and restart */}
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={isRecomposing || isUploading}
              className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-rose-500 dark:text-rose-400 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <Trash2 className="h-4.5 w-4.5 text-rose-500 group-hover/btn:text-[#060814] shrink-0" />
              <span>Retake</span>
            </button>

            {/* Gallery Button — uploads to Supabase first, then navigates */}
            <button
              onClick={handleGoToGallery}
              disabled={isUploading}
              className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-indigo-600 dark:text-indigo-405 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin" />
              ) : (
                <ImageIcon className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-405 group-hover/btn:text-[#060814] shrink-0" />
              )}
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
              onClick={async () => {
                if (!photostrip) { router.push('/capture'); return; }
                setIsUploading(true);
                try { await uploadCurrentState(photostrip); } finally { setIsUploading(false); }
                router.push('/capture');
              }}
              disabled={isUploading}
              className="group/btn relative overflow-hidden flex items-center gap-1.5 px-4.5 py-3.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border-0 text-indigo-600 dark:text-indigo-400 font-bold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <span>Next Strip</span>
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 group-hover/btn:text-[#060814] shrink-0" />
              )}
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
