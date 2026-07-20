import { IndexedDBService } from '../storage/IndexedDBService';
import { SupabaseService } from '../supabase/SupabaseService';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  isOnline: boolean;
  pendingCount: number;
}

type SyncListener = (status: SyncStatus) => void;

export class SyncService {
  private static listeners = new Set<SyncListener>();
  private static isOnline = false;
  private static isSyncing = false;
  private static pendingCount = 0;
  private static lastStatus: 'idle' | 'syncing' | 'error' = 'idle';
  private static checkIntervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize sync service, start network monitoring and sync loop.
   */
  static init(): void {
    if (typeof window === 'undefined') return;

    // Listen to browser network changes
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // Initial check
    this.checkConnectionAndSync();

    // Setup periodic connection health check (every 10 seconds)
    if (!this.checkIntervalId) {
      this.checkIntervalId = setInterval(() => {
        this.checkConnectionAndSync();
      }, 10000);
    }
  }

  /**
   * Stop background checking.
   */
  static destroy(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Subscribe to sync state changes.
   */
  static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Push current state immediately to new subscriber
    listener(this.getSyncStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current synchronization status.
   */
  static getSyncStatus(): SyncStatus {
    return {
      status: this.isSyncing ? 'syncing' : this.lastStatus,
      isOnline: this.isOnline,
      pendingCount: this.pendingCount,
    };
  }

  /**
   * Trigger the synchronization flow manually.
   */
  static async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    
    // Update pending count first
    await this.updatePendingCount();

    // Check if offline or no pending items
    if (!this.isOnline || this.pendingCount === 0) {
      this.notifyListeners();
      return;
    }

    this.isSyncing = true;
    this.lastStatus = 'syncing';
    this.notifyListeners();

    try {
      const unsyncedStrips = await IndexedDBService.getUnsyncedPhotostrips();
      
      for (const strip of unsyncedStrips) {
        // Double check online status inside loop
        if (!this.isOnline) break;

        try {
          await SupabaseService.uploadPhotostrip(strip);
          await IndexedDBService.markAsSynced(strip.id, new Date());
        } catch (uploadError) {
          console.error(`Failed to upload strip ${strip.id}:`, uploadError);
          // If we failed due to network, stop the loop and mark status as error
          const stillOnline = await SupabaseService.checkConnection();
          if (!stillOnline) {
            this.isOnline = false;
            break;
          }
        }
      }

      await this.updatePendingCount();
      this.lastStatus = 'idle';
    } catch (error) {
      console.error('Error during synchronization loop:', error);
      this.lastStatus = 'error';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Force check connection and perform sync if online.
   */
  private static async checkConnectionAndSync(): Promise<void> {
    const wasOnline = this.isOnline;
    this.isOnline = await SupabaseService.checkConnection();
    await this.updatePendingCount();

    // Trigger sync if status changed to online or we were already online and have pending items
    if (this.isOnline && (!wasOnline || this.pendingCount > 0)) {
      await this.triggerSync();
    } else {
      this.notifyListeners();
    }
  }

  private static handleNetworkChange(online: boolean): void {
    if (online) {
      this.checkConnectionAndSync();
    } else {
      this.isOnline = false;
      this.notifyListeners();
    }
  }

  private static async updatePendingCount(): Promise<void> {
    const unsynced = await IndexedDBService.getUnsyncedPhotostrips();
    this.pendingCount = unsynced.length;
  }

  private static notifyListeners(): void {
    const status = this.getSyncStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });
  }
}
