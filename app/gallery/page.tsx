/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, X, Image as ImageIcon, Cloud, CloudOff, ZoomIn, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { StorageService } from '@/services/storage/StorageService';
import { SupabaseService } from '@/services/supabase/SupabaseService';
import { IndexedDBService } from '@/services/storage/IndexedDBService';
import { AdminService } from '@/services/AdminService';
import { Photostrip } from '@/types';

// A lightweight type for Supabase-fetched records (no blob, has image_url)
interface RemoteStrip {
  id: string;
  filename: string;
  image_url: string;
  created_at: string;
  synced: true;
  isRemoteOnly: true;
}

// Union type used in the UI
type DisplayStrip = Photostrip | RemoteStrip;

function isRemoteOnly(strip: DisplayStrip): strip is RemoteStrip {
  return (strip as RemoteStrip).isRemoteOnly === true;
}

export default function GalleryPage() {
  const router = useRouter();
  const [selectedStrip, setSelectedStrip] = useState<DisplayStrip | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [stripToDelete, setStripToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [remoteStrips, setRemoteStrips] = useState<RemoteStrip[]>([]);
  const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);
  const [isReuploadingAll, setIsReuploadingAll] = useState<boolean>(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<string>('');

  // Sync auth state reactively on mount
  useEffect(() => {
    setIsAdmin(AdminService.isAuthenticated());
  }, []);

  // Reactively fetch all photostrips from Dexie IndexedDB (newest first)
  const localStrips = useLiveQuery(
    async () => {
      if (!db) return [];
      return await db.photostrips.orderBy('createdAt').reverse().toArray();
    },
    []
  );

  // Fetch all photostrips from Supabase cloud so every device sees them
  const fetchRemoteStrips = useCallback(async () => {
    setIsFetchingRemote(true);
    try {
      const { data, error } = await supabase
        .from('photostrips')
        .select('id, filename, image_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch remote strips from Supabase:', error.message);
        return;
      }

      if (data) {
        const mapped: RemoteStrip[] = data.map((row) => ({
          id: row.id,
          filename: row.filename,
          image_url: row.image_url,
          created_at: row.created_at,
          synced: true,
          isRemoteOnly: true,
        }));
        setRemoteStrips(mapped);
      }
    } catch (err) {
      console.warn('Error fetching remote strips:', err);
    } finally {
      setIsFetchingRemote(false);
    }
  }, []);

  useEffect(() => {
    fetchRemoteStrips();
  }, [fetchRemoteStrips]);

  // Merge local and remote strips, preferring local (which has blob data)
  const stripsList: DisplayStrip[] = React.useMemo(() => {
    const localIds = new Set((localStrips ?? []).map((s) => s.id));
    const remoteOnly = remoteStrips.filter((r) => !localIds.has(r.id));
    const combined: DisplayStrip[] = [
      ...(localStrips ?? []),
      ...remoteOnly,
    ];
    combined.sort((a, b) => {
      const aDate = isRemoteOnly(a) ? new Date((a as RemoteStrip).created_at).getTime() : (a as Photostrip).createdAt.getTime();
      const bDate = isRemoteOnly(b) ? new Date((b as RemoteStrip).created_at).getTime() : (b as Photostrip).createdAt.getTime();
      return bDate - aDate;
    });
    return combined;
  }, [localStrips, remoteStrips]);

  // Manage selected URL
  useEffect(() => {
    if (!selectedStrip) return;
    if (isRemoteOnly(selectedStrip)) {
      setSelectedUrl((selectedStrip as RemoteStrip).image_url);
      return () => setSelectedUrl(null);
    } else {
      const url = URL.createObjectURL((selectedStrip as Photostrip).imageBlob);
      setSelectedUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setSelectedUrl(null);
      };
    }
  }, [selectedStrip]);

  const getStripDate = (strip: DisplayStrip): Date => {
    if (isRemoteOnly(strip)) return new Date((strip as RemoteStrip).created_at);
    return (strip as Photostrip).createdAt;
  };

  const getStripFilename = (strip: DisplayStrip): string => {
    if (isRemoteOnly(strip)) return (strip as RemoteStrip).filename;
    return (strip as Photostrip).filename;
  };

  const isSynced = (strip: DisplayStrip): boolean => {
    if (isRemoteOnly(strip)) return true;
    return (strip as Photostrip).synced;
  };

  const handleDownload = async (strip: DisplayStrip) => {
    const filename = getStripFilename(strip);
    if (isRemoteOnly(strip)) {
      setDownloadingId(strip.id);
      try {
        const response = await fetch((strip as RemoteStrip).image_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        window.open((strip as RemoteStrip).image_url, '_blank');
      } finally {
        setDownloadingId(null);
      }
    } else {
      const url = URL.createObjectURL((strip as Photostrip).imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setStripToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!stripToDelete) return;
    setIsDeleting(true);
    try {
      await StorageService.deletePhotostrip(stripToDelete);
      if (selectedStrip?.id === stripToDelete) {
        setSelectedStrip(null);
      }
      setDeleteConfirmOpen(false);
      setStripToDelete(null);
      fetchRemoteStrips();
    } catch (err) {
      console.error('Failed to delete strip:', err);
      alert('Failed to delete the selected photostrip.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Force re-upload a single local strip to Supabase (overwrites old cloud version)
  const handleReupload = async (strip: Photostrip, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setReuploadingId(strip.id);
    try {
      await SupabaseService.uploadPhotostrip(strip);
      await IndexedDBService.markAsSynced(strip.id, new Date());
      await fetchRemoteStrips();
    } catch (err) {
      console.error('Failed to re-upload strip:', err);
      alert('Failed to re-upload photostrip to cloud.');
    } finally {
      setReuploadingId(null);
    }
  };

  // Force re-upload ALL local strips (fixes all out-of-sync framed/filtered photos at once)
  const handleReuploadAll = async () => {
    if (!(localStrips ?? []).length) return;
    setIsReuploadingAll(true);
    try {
      for (const strip of (localStrips ?? [])) {
        await SupabaseService.uploadPhotostrip(strip);
        await IndexedDBService.markAsSynced(strip.id, new Date());
      }
      await fetchRemoteStrips();
    } catch (err) {
      console.error('Failed to re-upload all strips:', err);
    } finally {
      setIsReuploadingAll(false);
    }
  };

  // Compile and download all photostrips as a single ZIP archive
  const handleDownloadAll = async () => {
    if (stripsList.length === 0) return;
    setIsDownloadingAll(true);
    setDownloadAllProgress('Initializing zip...');
    try {
      const JSZipModule = await import('@/lib/jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();

      const total = stripsList.length;
      for (let i = 0; i < total; i++) {
        const strip = stripsList[i];
        const indexStr = `${total - i}`.padStart(3, '0');
        const date = isRemoteOnly(strip) ? new Date(strip.created_at) : strip.createdAt;
        const formattedDate = date.toISOString().replace(/[:.]/g, '-');
        const entryFilename = `photostrip_${indexStr}_${formattedDate}.png`;

        setDownloadAllProgress(`Loading ${i + 1}/${total}...`);

        let blob: Blob;
        if (!isRemoteOnly(strip)) {
          blob = strip.imageBlob;
        } else {
          try {
            const response = await fetch(strip.image_url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            blob = await response.blob();
          } catch (fetchErr) {
            console.error(`Failed to fetch remote image for zip: ${strip.filename}`, fetchErr);
            continue;
          }
        }
        zip.file(entryFilename, blob);
      }

      setDownloadAllProgress('Packing ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });

      setDownloadAllProgress('Downloading...');
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photobooth_all_memories_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download all memories:', err);
      alert('Failed to generate ZIP archive of all photos.');
    } finally {
      setIsDownloadingAll(false);
      setDownloadAllProgress('');
    }
  };


  if (!localStrips) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold">Opening local database...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col gap-6 py-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-indigo-500" />
            Photo Gallery
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Browse through all vertical photostrips captured at this event station.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start flex-wrap">
          {/* Refresh button */}
          <button
            onClick={fetchRemoteStrips}
            disabled={isFetchingRemote}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh gallery from cloud"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingRemote ? 'animate-spin' : ''}`} />
            {isFetchingRemote ? 'Loading...' : 'Refresh'}
          </button>

          {/* Admin: Re-upload All to Cloud button */}
          {isAdmin && (localStrips ?? []).length > 0 && (
            <button
              onClick={handleReuploadAll}
              disabled={isReuploadingAll}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              title="Force re-upload all local photostrips to cloud (fixes missing frame/filter on other devices)"
            >
              <UploadCloud className={`h-3.5 w-3.5 ${isReuploadingAll ? 'animate-pulse' : ''}`} />
              {isReuploadingAll ? 'Uploading...' : 'Re-upload All to Cloud'}
            </button>
          )}

          {/* Admin: Download All Photos button */}
          {isAdmin && stripsList.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              title="Download all memories as a ZIP archive file"
            >
              <Download className={`h-3.5 w-3.5 ${isDownloadingAll ? 'animate-bounce' : ''}`} />
              {isDownloadingAll ? (downloadAllProgress || 'Downloading...') : 'Download All'}
            </button>
          )}

          {/* Count Badge */}
          <div className="px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            Total Captured: <span className="text-indigo-600 dark:text-indigo-400 font-black">{stripsList.length}</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {stripsList.length === 0 && !isFetchingRemote && (
        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl p-8 max-w-lg mx-auto border border-dashed border-slate-300 dark:border-slate-800">
          <div className="rounded-full bg-slate-100 dark:bg-slate-900 p-5 text-slate-500 mb-4 border border-slate-200 dark:border-slate-800">
            <ImageIcon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">No memories captured yet</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs mb-6">
            Start a capture session on the capture page to create your first event photostrip!
          </p>
          {isAdmin && (
            <button
              onClick={() => router.push('/capture')}
              className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-8 py-3.5 rounded-none bg-slate-900 dark:bg-white/5 border-0 text-white dark:text-white hover:text-[#060814] font-bold transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              <span>Start Capture Session</span>
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton while fetching remote and no local strips */}
      {isFetchingRemote && stripsList.length === 0 && (
        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading gallery from cloud...</p>
        </div>
      )}

      {/* Grid List */}
      {stripsList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {stripsList.map((strip) => {
            const imgSrc = isRemoteOnly(strip)
              ? (strip as RemoteStrip).image_url
              : URL.createObjectURL((strip as Photostrip).imageBlob);
            const date = getStripDate(strip);
            const synced = isSynced(strip);
            const isDownloading = downloadingId === strip.id;

            return (
              <div
                key={strip.id}
                onClick={() => setSelectedStrip(strip)}
                className="group relative flex flex-col rounded-2xl overflow-hidden glass-card glass-card-hover border border-slate-200 dark:border-slate-800/80 cursor-pointer"
              >
                {/* Image Container with fixed vertical aspect ratio */}
                <div className="relative w-full aspect-[1/3] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={getStripFilename(strip)}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    onLoad={() => { if (!isRemoteOnly(strip)) URL.revokeObjectURL(imgSrc); }}
                  />

                  {/* Hover Overlay controls */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="rounded-full bg-indigo-600 p-3 text-white shadow-lg">
                      <ZoomIn className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-slate-200 font-bold uppercase tracking-wider">Fullscreen</span>
                  </div>

                  {/* Sync Status Badge */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    {synced ? (
                      <div
                        className="rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 p-1.5 backdrop-blur-md shadow-md"
                        title="Synced to cloud"
                      >
                        <Cloud className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div
                        className="rounded-full bg-amber-950/80 border border-amber-500/20 text-amber-400 p-1.5 backdrop-blur-md shadow-md"
                        title="Stored offline, waiting to sync"
                      >
                        <CloudOff className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3.5 flex items-center justify-between bg-slate-100/80 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-900 gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase truncate">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                      {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Download: visible to all. Re-upload + Delete: admin only */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(strip); }}
                      disabled={isDownloading}
                      className="rounded-lg bg-slate-200 dark:bg-slate-900 hover:bg-indigo-500/10 p-1.5 text-slate-700 dark:text-slate-400 hover:text-indigo-500 transition-colors border border-slate-300 dark:border-slate-850 disabled:opacity-50"
                      title="Download image"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {/* Admin re-upload: only for local strips (has blob to push) */}
                    {isAdmin && !isRemoteOnly(strip) && (
                      <button
                        onClick={(e) => handleReupload(strip as Photostrip, e)}
                        disabled={reuploadingId === strip.id}
                        className="rounded-lg bg-slate-200 dark:bg-slate-900 hover:bg-indigo-500/10 p-1.5 text-slate-700 dark:text-slate-400 hover:text-indigo-500 transition-colors border border-slate-300 dark:border-slate-850 disabled:opacity-50"
                        title="Re-upload to cloud (push current frame/filter to Supabase)"
                      >
                        {reuploadingId === strip.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(strip.id, e)}
                        className="rounded-lg bg-slate-200 dark:bg-slate-900 hover:bg-rose-500/10 p-1.5 text-slate-700 dark:text-slate-400 hover:text-rose-500 transition-colors border border-slate-300 dark:border-slate-850"
                        title="Delete strip"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <AnimatePresence>
        {selectedStrip && selectedUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md"
            onClick={() => setSelectedStrip(null)}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative flex flex-col md:flex-row max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden max-h-[90vh]"
              onClick={(e) => e.stopPropagation()} // Stop closing
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStrip(null)}
                className="absolute top-4 right-4 z-30 rounded-full bg-slate-100/60 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-950 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Side: Dynamic Photostrip display */}
              <div className="flex-1 flex justify-center items-center bg-slate-50/40 dark:bg-slate-950/40 p-6 md:p-8 max-h-[60vh] md:max-h-none overflow-y-auto">
                <div className="w-[180px] sm:w-[220px] aspect-[1/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 bg-white">
                  <img
                    src={selectedUrl}
                    alt={getStripFilename(selectedStrip)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side: Meta Info and Controls */}
              <div className="w-full md:w-[320px] p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                {/* Meta details */}
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">
                      Event Photostrip
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-3">{getStripFilename(selectedStrip)}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      Captured: {getStripDate(selectedStrip).toLocaleString()}
                    </p>
                  </div>

                  {/* Sync status section */}
                  <div className="p-3.5 rounded-2xl bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-950 flex items-center gap-3">
                    {isSynced(selectedStrip) ? (
                      <>
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-455 border border-emerald-500/10">
                          <Cloud className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-205">Cloud Backed Up</p>
                          <p className="text-[10px] text-slate-550 mt-0.5">Synced automatically</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-full bg-amber-500/10 p-2 text-amber-455 border border-amber-500/10">
                          <CloudOff className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-205">Stored Offline Only</p>
                          <p className="text-[10px] text-slate-550 mt-0.5">Waiting for connection</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Download visible to all; Delete only for Admin */}
                <div className="flex flex-col gap-2.5 mt-8">
                  {/* Download button: visible to everyone */}
                  <button
                    onClick={() => handleDownload(selectedStrip)}
                    disabled={downloadingId === selectedStrip.id}
                    className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-none bg-slate-900 dark:bg-white/5 border-0 text-white dark:text-white hover:text-[#060814] font-bold transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                    {downloadingId === selectedStrip.id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Download className="h-4.5 w-4.5 text-[#ff0055] group-hover/btn:text-[#060814]" />
                    )}
                    <span>{downloadingId === selectedStrip.id ? 'Downloading...' : 'Download PNG'}</span>
                  </button>
                  {/* Delete button: admin only */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(selectedStrip.id)}
                      className="group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-none bg-rose-50 dark:bg-white/5 border border-rose-200 dark:border-transparent text-rose-500 dark:text-rose-400 font-semibold transition-all duration-300 ease-out hover:text-[#060814] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer z-10"
                    >
                      <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                      <Trash2 className="h-4.5 w-4.5 text-rose-500 group-hover/btn:text-[#060814]" />
                      <span>Delete Strip</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="mx-auto rounded-full bg-rose-500/10 p-3.5 text-rose-500 border border-rose-500/10">
                <Trash2 className="h-6 w-6" />
              </div>
              
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Delete Photostrip?</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                  Are you sure you want to delete this photostrip permanently? This will remove it from this device and your Supabase cloud storage.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setStripToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
