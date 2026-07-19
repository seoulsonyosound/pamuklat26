'use client';

import React from 'react';
import { PHOTOBOOTH_FILTERS, PhotoboothFilter } from '@/utils/filters';
import { Sparkles, Wand2 } from 'lucide-react';

interface FilterSelectorBarProps {
  activeFilterId: string;
  onSelectFilter: (filter: PhotoboothFilter) => void;
  disabled?: boolean;
}

export const FilterSelectorBar: React.FC<FilterSelectorBarProps> = ({
  activeFilterId,
  onSelectFilter,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Wand2 className="h-3.5 w-3.5 text-rose-500" />
          <span>Photobooth Style Filter</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 italic">
          Offline Client-Side
        </span>
      </div>

      {/* Responsive grid for filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full py-1">
        {PHOTOBOOTH_FILTERS.map((filter) => {
          const isActive = filter.id === activeFilterId;
          return (
            <button
              key={filter.id}
              onClick={() => onSelectFilter(filter)}
              disabled={disabled}
              type="button"
              className={`group relative transition-all duration-300 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full h-12 flex items-center justify-center text-center px-3 text-sm font-semibold rounded-xl border gap-1.5 ${
                isActive
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 scale-[1.02]'
                  : 'bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
              }`}
            >
              {isActive && <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0" />}
              <span className="truncate">{filter.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default FilterSelectorBar;
