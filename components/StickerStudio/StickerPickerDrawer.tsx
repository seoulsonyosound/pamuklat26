/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { PHOTOBOOTH_STICKERS, StickerItem } from '@/utils/stickers';
import { Sparkles, Plus } from 'lucide-react';

interface StickerPickerDrawerProps {
  onAddSticker: (sticker: StickerItem) => void;
}

export const StickerPickerDrawer: React.FC<StickerPickerDrawerProps> = ({ onAddSticker }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span>Sticker &amp; Prop Library ({PHOTOBOOTH_STICKERS.length})</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium italic">
          Click sticker to place on canvas
        </span>
      </div>

      {/* Scrollable grid of 50 stickers */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
        {PHOTOBOOTH_STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onAddSticker(sticker)}
            type="button"
            className="group relative aspect-square p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
            title={`Add ${sticker.name}`}
          >
            <img
              src={sticker.url}
              alt={sticker.name}
              className="w-full h-full object-contain pointer-events-none group-hover:scale-110 transition-transform"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
