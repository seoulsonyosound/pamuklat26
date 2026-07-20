import { IndexedDBService } from './IndexedDBService';
import { SupabaseService } from '../supabase/SupabaseService';
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
   * Saves a new captured photostrip along with its 4 raw snapshot blobs for post-capture editing.
   */
  static async savePhotostripWithRaw(
    imageBlob: Blob,
    rawPhotos: Blob[]
  ): Promise<Photostrip> {
    const deviceId = this.getDeviceId();
    const timestamp = Date.now();
    const id = generatePbId();
    const filename = `strip_${timestamp}_${deviceId}.png`;

    const photostrip: Photostrip = {
      id,
      filename,
      imageBlob,
      rawPhotos,
      selectedFrameId: null,
      selectedFilterId: 'normal',
      createdAt: new Date(),
      uploadedAt: null,
      synced: false,
      deviceId,
    };

    await IndexedDBService.savePhotostrip(photostrip);

    SyncService.triggerSync().catch((err) => {
      console.error('Trigger sync error:', err);
    });

    return photostrip;
  }

  /**
   * Saves a new captured photostrip.
   */
  static async savePhotostrip(imageBlob: Blob): Promise<Photostrip> {
    return this.savePhotostripWithRaw(imageBlob, []);
  }

  /**
   * Update an existing photostrip record with newly rendered imageBlob, frameId, and filterId.
   */
  static async updatePhotostrip(
    id: string,
    newImageBlob: Blob,
    selectedFrameId?: string | null,
    selectedFilterId?: string
  ): Promise<void> {
    const existing = await IndexedDBService.getPhotostrip(id);
    if (!existing) return;

    const updated: Photostrip = {
      ...existing,
      imageBlob: newImageBlob,
      selectedFrameId: selectedFrameId !== undefined ? selectedFrameId : existing.selectedFrameId,
      selectedFilterId: selectedFilterId !== undefined ? selectedFilterId : existing.selectedFilterId,
    };

    await IndexedDBService.savePhotostrip(updated);
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

    // 2. Best-effort delete from Supabase (non-blocking)
    SupabaseService.deletePhotostrip(id).catch((err) => {
      console.warn(`Failed to delete remote strip ${id} during local deletion (might be offline):`, err);
    });
  }

  /**
   * Save a custom frame template blob in multi-frame array.
   */
  static async saveFrame(filename: string, imageBlob: Blob): Promise<FrameTemplate> {
    const id = generatePbId();
    const frame: FrameTemplate = {
      id,
      filename,
      imageBlob,
      createdAt: new Date(),
      isActive: true,
    };
    await IndexedDBService.saveFrame(frame);
    
    // Upload frame to Supabase storage and DB
    await SupabaseService.uploadFrame(frame);

    return frame;
  }

  /**
   * Retrieve all uploaded custom frame templates.
   */
  static async getAllFrames(): Promise<FrameTemplate[]> {
    return await IndexedDBService.getAllFrames();
  }

  /**
   * Retrieve the active (or specific) custom frame template.
   */
  static async getFrame(id?: string): Promise<FrameTemplate | undefined> {
    return await IndexedDBService.getFrame(id);
  }

  /**
   * Set a specific frame template as active.
   */
  static async setActiveFrame(id: string): Promise<void> {
    await IndexedDBService.setActiveFrame(id);
  }

  /**
   * Delete a custom frame template by ID.
   */
  static async deleteFrame(id: string): Promise<void> {
    await IndexedDBService.deleteFrame(id);

    // Best-effort delete from Supabase (non-blocking)
    SupabaseService.deleteFrame(id).catch((err) => {
      console.warn(`Failed to delete remote frame ${id} during local deletion:`, err);
    });
  }

  /**
   * Save camera settings.
   */
  static async saveCameraSettings(selectedDeviceId: string, resolution: string = '1280x720', isMirrored: boolean = false): Promise<void> {
    const settings: CameraSettings = {
      id: 'camera_settings',
      selectedDeviceId,
      resolution,
      isMirrored,
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
