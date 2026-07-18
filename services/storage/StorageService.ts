import { IndexedDBService } from './IndexedDBService';
import { PocketBaseService } from '../pocketbase/PocketBaseService';
import { SyncService } from '../sync/SyncService';
import { Photostrip, FrameTemplate, CameraSettings } from '@/types';
import { generatePbId } from '@/utils/id';

export class StorageService {
  private static DEVICE_ID_KEY = 'photobooth_device_id';

  /**
   * Get or generate a unique device ID for this browser client.
   */
  static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate a 12-char device ID
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      deviceId = 'dev_';
      for (let i = 0; i < 8; i++) {
        deviceId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Saves a new captured photostrip.
   * Saves locally to IndexedDB immediately, and then triggers background sync.
   */
  static async savePhotostrip(imageBlob: Blob): Promise<Photostrip> {
    const deviceId = this.getDeviceId();
    const timestamp = Date.now();
    const id = generatePbId(); // 15-char PocketBase ID
    const filename = `strip_${timestamp}_${deviceId}.png`;

    const photostrip: Photostrip = {
      id,
      filename,
      imageBlob,
      createdAt: new Date(),
      uploadedAt: null,
      synced: false,
      deviceId,
    };

    // 1. Save locally to IndexedDB
    await IndexedDBService.savePhotostrip(photostrip);

    // 2. Trigger background sync (async)
    SyncService.triggerSync().catch((err) => {
      console.error('Trigger sync error:', err);
    });

    return photostrip;
  }

  /**
   * Fetch all photostrips from IndexedDB (newest first).
   */
  static async getPhotostrips(): Promise<Photostrip[]> {
    return await IndexedDBService.getPhotostrips();
  }

  /**
   * Delete a photostrip locally and attempt to delete it from the cloud.
   */
  static async deletePhotostrip(id: string): Promise<void> {
    // 1. Delete from local database immediately
    await IndexedDBService.deletePhotostrip(id);

    // 2. Best-effort delete from PocketBase (non-blocking)
    PocketBaseService.deletePhotostrip(id).catch((err) => {
      console.warn(`Failed to delete remote strip ${id} during local deletion (might be offline):`, err);
    });
  }

  /**
   * Save a custom frame template blob.
   */
  static async saveFrame(filename: string, imageBlob: Blob): Promise<FrameTemplate> {
    const frame: FrameTemplate = {
      id: 'current_frame',
      filename,
      imageBlob,
      createdAt: new Date(),
    };
    await IndexedDBService.saveFrame(frame);
    return frame;
  }

  /**
   * Retrieve the active custom frame template.
   */
  static async getFrame(): Promise<FrameTemplate | undefined> {
    return await IndexedDBService.getFrame();
  }

  /**
   * Delete the custom frame template.
   */
  static async deleteFrame(): Promise<void> {
    await IndexedDBService.deleteFrame();
  }

  /**
   * Save camera settings.
   */
  static async saveCameraSettings(selectedDeviceId: string, resolution: string = '1280x720'): Promise<void> {
    const settings: CameraSettings = {
      id: 'camera_settings',
      selectedDeviceId,
      resolution,
      updatedAt: new Date(),
    };
    await IndexedDBService.saveCameraSettings(settings);
  }

  /**
   * Retrieve camera settings.
   */
  static async getCameraSettings(): Promise<CameraSettings | undefined> {
    return await IndexedDBService.getCameraSettings();
  }
}
