'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { StickerItem } from '@/utils/stickers';
import { PlacedSticker } from './URLImage';
import { StickerPickerDrawer } from './StickerPickerDrawer';
import { Download, Trash2, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Dynamic import of StickerCanvas with ssr: false to prevent Next.js SSR hydration errors
const StickerCanvas = dynamic(
  () => import('./StickerCanvas').then((mod) => mod.StickerCanvas),
  { ssr: false }
);

interface StickerStudioViewProps {
  photoUrls?: string[];
  onSaved?: (publicUrl: string) => void;
}

export const StickerStudioView: React.FC<StickerStudioViewProps> = ({
  photoUrls = [],
  onSaved,
}) => {
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stageRef = useRef<any>(null);

  // Add sticker to canvas centered with default 80x80 dimensions
  const handleAddSticker = (item: StickerItem) => {
    const newSticker: PlacedSticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: item.url,
      x: 110, // centered on 300px canvas (300/2 - 80/2 = 110)
      y: 410, // centered on 900px canvas (900/2 - 80/2 = 410)
      width: 80,
      height: 80,
      rotation: 0,
    };

    setStickers((prev) => [...prev, newSticker]);
    setSelectedId(newSticker.id);
  };

  const handleUpdateSticker = (updated: PlacedSticker) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAllStickers = () => {
    setStickers([]);
    setSelectedId(null);
  };

  /**
   * Pipeline:
   * 1. Export Konva stage to high-res Blob (pixelRatio: 3)
   * 2. Upload Blob to Supabase Storage ('photobooth-strips' bucket)
   * 3. Insert record into Supabase 'gallery' table (image_url, stickers_count)
   * 4. Trigger direct browser download simultaneously
   */
  const saveToSupabase = async () => {
    if (!stageRef.current) return;
    setIsSaving(true);
    setNotification(null);
    setSelectedId(null); // deselect transformer box before exporting canvas

    // Allow UI state to update (hide transformer box)
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // 1. Export Canvas to High-Res Blob
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
      const blob = await (await fetch(dataUrl)).blob();

      // Trigger direct browser file download for the user simultaneously
      const downloadFileName = `pamuklat_${Date.now()}.png`;
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = downloadFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 2. Upload Image to Supabase Storage Bucket ('photobooth-strips')
      const storagePath = `strips/pamuklat_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photobooth-strips')
        .upload(storagePath, blob, { contentType: 'image/png' });

      if (uploadError) {
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      // 3. Get Public URL for the uploaded photo strip
      const { data: publicUrlData } = supabase.storage
        .from('photobooth-strips')
        .getPublicUrl(uploadData.path);

      // 4. Insert Record into Supabase 'gallery' Table
      const { error: dbError } = await supabase
        .from('gallery')
        .insert([
          {
            image_url: publicUrlData.publicUrl,
            stickers_count: stickers.length,
          },
        ]);

      if (dbError) {
        throw new Error(`Database insert error: ${dbError.message}`);
      }

      setNotification({
        type: 'success',
        message: 'Photostrip saved to gallery and downloaded successfully!',
      });

      if (onSaved) {
        onSaved(publicUrlData.publicUrl);
      }
    } catch (err: any) {
      console.error('Save pipeline error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save photostrip to gallery.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full py-4 px-2">
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sticker &amp; Widget Studio
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Drag, rotate, and scale props on your photo strip before exporting to gallery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {selectedId && (
            <button
              onClick={() => handleDeleteSticker(selectedId)}
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected</span>
            </button>
          )}

          {stickers.length > 0 && (
            <button
              onClick={handleClearAllStickers}
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear All ({stickers.length})</span>
            </button>
          )}

          <button
            onClick={saveToSupabase}
            disabled={isSaving}
            type="button"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save & Download'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Studio Grid: Canvas Preview + Sticker Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left/Top: Interactive Konva Canvas (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center gap-2">
          <StickerCanvas
            photoUrls={photoUrls}
            stickers={stickers}
            selectedId={selectedId}
            onSelectSticker={setSelectedId}
            onChangeSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
            stageRef={stageRef}
            canvasWidth={300}
            canvasHeight={900}
          />
          <span className="text-[10px] font-semibold text-slate-400 mt-1">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">Delete</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">Backspace</kbd> to remove selected props.
          </span>
        </div>

        {/* Right/Bottom: Sticker Picker Drawer (7 Cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <StickerPickerDrawer onAddSticker={handleAddSticker} />
        </div>
      </div>
    </div>
  );
};
