import { useState, useEffect } from 'react';
import { SyncService, SyncStatus } from '@/services/sync/SyncService';

export function useSyncStatus(): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    return SyncService.getSyncStatus();
  });

  useEffect(() => {
    // Initialize the SyncService (only runs once internally)
    SyncService.init();

    // Subscribe to state updates
    const unsubscribe = SyncService.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return syncStatus;
}
