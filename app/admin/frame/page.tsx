/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, LayoutTemplate, CheckCircle, AlertTriangle, Loader2, LogOut } from 'lucide-react';
import { StorageService } from '@/services/storage/StorageService';
import { AdminService } from '@/services/AdminService';

export default function AdminFramePage() {
  const router = useRouter();
  const [frameName, setFrameName] = useState<string>('');
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeUrlRef = useRef<string | null>(null);

  const handleLogout = () => {
    AdminService.logout();
    router.push('/admin/login');
  };

  // Load existing custom frame on mount
  useEffect(() => {
    if (!AdminService.isAuthenticated()) {
      router.replace('/admin/login');
      return;
    }

    async function loadStoredFrame() {
      setIsLoading(true);
      try {
        const frame = await StorageService.getFrame();
        if (frame) {
          setFrameName(frame.filename);
          const url = URL.createObjectURL(frame.imageBlob);
          activeUrlRef.current = url;
          setFrameUrl(url);
        }
      } catch (err) {
        console.error('Failed to load stored custom frame:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredFrame();

    return () => {
      // Clean up object URLs
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, [router]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      showNotification('error', 'Only transparent PNG templates are supported.');
      return;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      // Save frame to IndexedDB
      await StorageService.saveFrame(file.name, file);
      
      // Update local state
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      setFrameName(file.name);
      const url = URL.createObjectURL(file);
      activeUrlRef.current = url;
      setFrameUrl(url);
      showNotification('success', 'Custom frame template uploaded and saved offline successfully!');
    } catch (err) {
      console.error('Error saving custom frame:', err);
      showNotification('error', 'Failed to store custom frame locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFrame = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      await StorageService.deleteFrame();
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
      setFrameName('');
      setFrameUrl(null);
      showNotification('success', 'Custom frame deleted. Reverted to Memories default branding layout.');
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

  return (
    <div className="flex-grow flex flex-col gap-6 max-w-4xl mx-auto py-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <LayoutTemplate className="h-7 w-7 text-indigo-500" />
            Photostrip Frame Template
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Upload a transparent PNG overlay to customize the branding for your event.
          </p>
        </div>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-none bg-white/5 border-0 text-slate-300 hover:text-[#060814] font-bold transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
        >
          <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
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
          <p className="text-slate-400 text-sm font-semibold">Loading custom frame settings...</p>
        </div>
      ) : (
        /* Frame Settings Workspace */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Upload Side */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white">Upload Area</h2>
            
            <div className="relative border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all bg-slate-950/20 hover:bg-slate-950/40">
              <input
                type="file"
                accept="image/png"
                onChange={handleFileUpload}
                disabled={isSaving}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="rounded-full bg-rose-500/10 p-4 text-rose-455 mb-3 border border-rose-500/10">
                <Upload className="h-7 w-7" />
              </div>
              <p className="text-slate-205 text-sm font-bold">Select PNG Frame</p>
              <p className="text-slate-550 text-xs mt-1">Drag and drop or browse files</p>
              <p className="text-slate-550 text-[10px] mt-2 italic">Recommended size: 800 x 2400 pixels</p>
            </div>

            {frameUrl && (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-950/30 border border-slate-900">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Active Custom Frame</p>
                    <p className="text-white text-sm font-bold truncate mt-0.5">{frameName}</p>
                  </div>
                  {/* Remove template button: slide effect */}
                  <button
                    onClick={handleRemoveFrame}
                    disabled={isSaving}
                    className="group/btn relative overflow-hidden rounded-none bg-white/5 border-0 p-2.5 text-rose-455 hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
                    title="Remove template"
                  >
                    <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                    <Trash2 className="h-4.5 w-4.5 text-rose-550 group-hover/btn:text-[#060814]" />
                  </button>
                </div>
              </div>
            )}

            {!frameUrl && (
              <div className="p-4 rounded-2xl bg-slate-950/20 border border-slate-900 text-slate-550 text-xs font-medium italic">
                No custom frame uploaded. The app will generate photostrips with the standard &quot;SSITE Photobooth&quot; footer layout.
              </div>
            )}
          </div>

          {/* Live Preview / Mockup Side */}
          <div className="flex flex-col gap-4 items-center">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase w-full text-left">
              Photostrip Mockup Preview
            </h2>

            <div className="relative w-[220px] h-[660px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white">
              {/* Mock Photos Stacking (White Canvas layout underneath frame) */}
              <div className="absolute inset-0 p-[13.75px] flex flex-col gap-[11px] bg-white">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full aspect-[4/3] bg-slate-100 border border-slate-200/50 flex flex-col items-center justify-center text-slate-300"
                  >
                    <span className="text-[10px] font-bold">Photo {idx + 1}</span>
                  </div>
                ))}
                
                {/* Fallback mockup footer text if no frame is set */}
                {!frameUrl && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-2 pb-2">
                    <p className="text-[9px] font-black text-slate-800 tracking-wider">SSITE PHOTOBOOTH</p>
                    <p className="text-[6px] font-bold text-slate-400 mt-0.5">Captured with ❤️ • Offline-First</p>
                  </div>
                )}
              </div>

              {/* Custom Transparent Frame overlay */}
              {frameUrl && (
                <img
                  src={frameUrl}
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
