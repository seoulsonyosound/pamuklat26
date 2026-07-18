/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, X, Image as ImageIcon, Cloud, CloudOff, ZoomIn, Loader2 } from 'lucide-react';
import { db } from '@/lib/db';
import { StorageService } from '@/services/storage/StorageService';
import { Photostrip } from '@/types';

export default function GalleryPage() {
  const [selectedStrip, setSelectedStrip] = useState<Photostrip | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Reactively fetch all photostrips from Dexie IndexedDB (newest first)
  const stripsList = useLiveQuery(
    async () => {
      if (!db) return [];
      return await db.photostrips.orderBy('createdAt').reverse().toArray();
    },
    []
  );

  // Revoke object url on viewer close
  useEffect(() => {
    if (selectedStrip) {
      const url = URL.createObjectURL(selectedStrip.imageBlob);
      setSelectedUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setSelectedUrl(null);
      };
    }
  }, [selectedStrip]);

  const handleDownload = (strip: Photostrip) => {
    const url = URL.createObjectURL(strip.imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = strip.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation(); // Avoid triggering lightbox close/open
    
    if (confirm('Are you sure you want to delete this photostrip permanently?')) {
      try {
        await StorageService.deletePhotostrip(id);
        if (selectedStrip?.id === id) {
          setSelectedStrip(null);
        }
      } catch (err) {
        console.error('Failed to delete strip:', err);
        alert('Failed to delete the selected photostrip.');
      }
    }
  };

  if (!stripsList) {
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-indigo-500" />
            Photo Gallery
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Browse through all vertical photostrips captured at this event station.
          </p>
        </div>
        
        {/* Count Badge */}
        <div className="self-start px-4 py-2 rounded-xl bg-slate-950/40 border border-slate-900 text-xs sm:text-sm font-bold text-slate-300">
          Total Captured: <span className="text-indigo-400 font-black">{stripsList.length}</span>
        </div>
      </div>

      {/* Empty State */}
      {stripsList.length === 0 && (
        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl p-8 max-w-lg mx-auto border border-dashed border-slate-800">
          <div className="rounded-full bg-slate-900 p-5 text-slate-505 mb-4 border border-slate-800">
            <ImageIcon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No memories captured yet</h3>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Start a capture session on the capture page to create your first event photostrip!
          </p>
          <a
            href="/capture"
            className="px-6 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-600 font-bold text-white transition-all shadow-lg shadow-indigo-650/20 border-0"
          >
            Start Capture Session
          </a>
        </div>
      )}

      {/* Grid List */}
      {stripsList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {stripsList.map((strip) => {
            const tempUrl = URL.createObjectURL(strip.imageBlob);
            
            return (
              <div
                key={strip.id}
                onClick={() => setSelectedStrip(strip)}
                className="group relative flex flex-col rounded-2xl overflow-hidden glass-card glass-card-hover border border-slate-800/80 cursor-pointer"
              >
                {/* Image Container with fixed vertical aspect ratio */}
                <div className="relative w-full aspect-[1/3] bg-slate-950 overflow-hidden">
                  <img
                    src={tempUrl}
                    alt={strip.filename}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    onLoad={() => URL.revokeObjectURL(tempUrl)} // Free object url once rendered
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
                    {strip.synced ? (
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
                <div className="p-3.5 flex items-center justify-between bg-slate-950/40 border-t border-slate-900 gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                      {new Date(strip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                      {new Date(strip.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(strip);
                      }}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors border border-slate-850"
                      title="Download image"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(strip.id, e)}
                      className="rounded-lg bg-slate-900 hover:bg-rose-500/10 p-1.5 text-slate-400 hover:text-rose-400 transition-colors border border-slate-850"
                      title="Delete strip"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
            onClick={() => setSelectedStrip(null)}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative flex flex-col md:flex-row max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-h-[90vh]"
              onClick={(e) => e.stopPropagation()} // Stop closing
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStrip(null)}
                className="absolute top-4 right-4 z-30 rounded-full bg-slate-950/60 hover:bg-slate-950 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Side: Dynamic Photostrip display */}
              <div className="flex-1 flex justify-center items-center bg-slate-950/40 p-6 md:p-8 max-h-[60vh] md:max-h-none overflow-y-auto">
                <div className="w-[180px] sm:w-[220px] aspect-[1/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-white">
                  <img
                    src={selectedUrl}
                    alt={selectedStrip.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side: Meta Info and Controls */}
              <div className="w-full md:w-[320px] p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900">
                {/* Meta details */}
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">
                      Event Photostrip
                    </span>
                    <h3 className="text-lg font-bold text-white truncate mt-3">{selectedStrip.filename}</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Captured: {new Date(selectedStrip.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Sync status section */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-950 flex items-center gap-3">
                    {selectedStrip.synced ? (
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

                {/* Actions */}
                <div className="flex flex-col gap-2.5 mt-8">
                  <button
                    onClick={() => handleDownload(selectedStrip)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold transition-all cursor-pointer shadow-lg shadow-indigo-650/10 border-0"
                  >
                    <Download className="h-4.5 w-4.5" />
                    Download PNG
                  </button>
                  <button
                    onClick={() => handleDelete(selectedStrip.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-950 hover:bg-rose-500/10 text-rose-455 font-semibold border border-rose-500/5 hover:border-rose-500/15 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    Delete Strip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
