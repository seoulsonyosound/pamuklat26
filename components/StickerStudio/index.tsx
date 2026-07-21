'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Requirement #7: Import Konva component dynamically with { ssr: false } to prevent Next.js SSR hydration errors
const StickerStudioView = dynamic(
  () => import('./StickerStudioView').then((mod) => mod.StickerStudioView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading Sticker Studio Canvas...</p>
      </div>
    ),
  }
);

export default StickerStudioView;
