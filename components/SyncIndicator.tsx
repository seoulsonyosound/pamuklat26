'use client';

import React from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export const SyncIndicator: React.FC = () => {
  const { status, isOnline, pendingCount } = useSyncStatus();

  if (isOnline) {
    if (status === 'syncing') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-blue-500/5 animate-pulse">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Syncing {pendingCount > 0 ? `(${pendingCount} left)` : ''}</span>
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/5">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Queue: {pendingCount} pending</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-500/5">
        <Cloud className="h-3.5 w-3.5" />
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          Synced
        </span>
      </div>
    );
  }

  // Offline state - remove offline badge/text completely
  return null;
};
export default SyncIndicator;
