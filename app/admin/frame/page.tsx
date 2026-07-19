/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, LayoutTemplate, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { StorageService } from '@/services/storage/StorageService';
import { AdminService } from '@/services/AdminService';
import { FrameTemplate } from '@/types';

const MAX_FRAME_CAPACITY = 10;

export default function AdminFramePage() {
  const router = useRouter();
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [frameUrls, setFrameUrls] = useState<Record<string, string>>({});
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeUrlsRef = useRef<Record<string, string>>({});

  const loadAllFrames = async () => {
    setIsLoading(true);
    try {
      const storedFrames = await StorageService.getAllFrames();
      setFrames(storedFrames);

      // Clean up previous object URLs
      Object.values(activeUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      
      const newUrls: Record<string, string> = {};
      storedFrames.forEach((frame) => {
        newUrls[frame.id] = URL.createObjectURL(frame.imageBlob);
      });

      activeUrlsRef.current = newUrls;
      setFrameUrls(newUrls);
      
      if (storedFrames.length > 0) {
        setPreviewFrameId(storedFrames[0].id);
      } else {
        setPreviewFrameId(null);
      }
    } catch (err) {
      console.error('Failed to load stored custom frames:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!AdminService.isAuthenticated()) {
      router.replace('/admin/login');
      return;
    }

    loadAllFrames();

    return () => {
      Object.values(activeUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      activeUrlsRef.current = {};
    };
  }, [router]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (frames.length >= MAX_FRAME_CAPACITY) {
      showNotification('error', `Maximum repository capacity reached (${MAX_FRAME_CAPACITY}/${MAX_FRAME_CAPACITY} frames).`);
      return;
    }

    if (file.type !== 'image/png') {
      showNotification('error', 'Only transparent PNG templates are supported.');
      return;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      await StorageService.saveFrame(file.name, file);
      await loadAllFrames();
      showNotification('success', 'Custom frame template uploaded to repository successfully!');
    } catch (err) {
      console.error('Error saving custom frame:', err);
      showNotification('error', 'Failed to store custom frame locally.');
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const handleRemoveFrame = async (id: string) => {
    setIsSaving(true);
    setNotification(null);

    try {
      await StorageService.deleteFrame(id);
      await loadAllFrames();
      showNotification('success', 'Frame template removed from repository.');
    } catch (err) {
      console.error('Error removing custom frame:', err);
      showNotification('error', 'Failed to remove custom frame template.');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const activeUrl = previewFrameId ? frameUrls[previewFrameId] : null;
  const isFull = frames.length >= MAX_FRAME_CAPACITY;

  return (
    <div className="flex-grow flex flex-col gap-6 max-w-5xl mx-auto py-4 w-full">
      {/* Title Header (Single Logout in Top Navbar only) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="h-7 w-7 text-indigo-500" />
            Template Upload Repository
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Admin Repository for managing transparent PNG border overlays. Maximum collection capacity: {MAX_FRAME_CAPACITY} frames.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading frame repository...</p>
        </div>
      ) : (
        /* Repository Workspace */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Left Side: Upload & Repository Collection (3 Cols) */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {/* Upload Box */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload New Frame</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {frames.length} / {MAX_FRAME_CAPACITY} Used
                </span>
              </div>
              
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                  isFull
                    ? 'border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 opacity-60'
                    : 'border-slate-300 dark:border-slate-700 hover:border-rose-500 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-950/40'
                }`}
              >
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFileUpload}
                  disabled={isSaving || isFull}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="rounded-full bg-rose-500/10 p-3.5 text-rose-500 mb-2.5 border border-rose-500/10">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-sm font-bold">
                  {isFull ? 'Capacity Reached' : 'Select PNG Frame'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  {isFull
                    ? `Delete an existing frame to upload a new asset (${MAX_FRAME_CAPACITY}/${MAX_FRAME_CAPACITY}).`
                    : 'Drag and drop or browse files'}
                </p>
                <p className="text-slate-400 text-[10px] mt-2 italic">Recommended size: 800 x 2400 pixels</p>
              </div>
            </div>

            {/* Frame Repository List (Upload repository ONLY - no selection actions) */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Uploaded Asset Repository
              </h2>

              {frames.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900 text-slate-500 text-xs font-medium italic text-center">
                  No frames in repository. Upload up to {MAX_FRAME_CAPACITY} PNG templates.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {frames.map((frame, idx) => {
                    const url = frameUrls[frame.id];
                    const isSelectedPreview = previewFrameId === frame.id;

                    return (
                      <div
                        key={frame.id}
                        onClick={() => setPreviewFrameId(frame.id)}
                        className={`group relative rounded-2xl p-4 border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                          isSelectedPreview
                            ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500'
                            : 'bg-white/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {/* Frame Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-10 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white shrink-0">
                            {url && (
                              <img
                                src={url}
                                alt={frame.filename}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                              Asset #{idx + 1}
                            </span>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {frame.filename}
                            </p>
                          </div>
                        </div>

                        {/* Delete Action Only (No Set Active buttons) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFrame(frame.id);
                          }}
                          disabled={isSaving}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete template asset"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Asset Preview Mockup (2 Cols) */}
          <div className="md:col-span-2 flex flex-col gap-4 items-center">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase w-full text-left">
              Repository Mockup Inspector
            </h2>

            <div className="relative w-[220px] h-[660px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white">
              {/* Mock Photos Stacking */}
              <div className="absolute inset-0 p-[13.75px] flex flex-col gap-[11px] bg-white">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full aspect-[4/3] bg-slate-100 border border-slate-200/50 flex flex-col items-center justify-center text-slate-300"
                  >
                    <span className="text-[10px] font-bold">Photo {idx + 1}</span>
                  </div>
                ))}
                {!activeUrl && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-2 pb-2">
                    <p className="text-[9px] font-black text-slate-800 tracking-wider">SSITE PHOTOBOOTH</p>
                    <p className="text-[6px] font-bold text-slate-400 mt-0.5">Captured with ❤️ • Offline-First</p>
                  </div>
                )}
              </div>

              {/* Custom Transparent Frame overlay */}
              {activeUrl && (
                <img
                  src={activeUrl}
                  alt="Frame Overlay Preview"
                  className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
