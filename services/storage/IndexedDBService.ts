import { db } from '@/lib/db';
import { Photostrip, FrameTemplate, CameraSettings } from '@/types';

export class IndexedDBService {
  /**
   * Save a photostrip locally.
   */
  static async savePhotostrip(photostrip: Photostrip): Promise<void> {
    if (!db) return;
    await db.photostrips.put(photostrip);
  }

  /**
   * Retrieve a single photostrip by its ID.
   */
  static async getPhotostrip(id: string): Promise<Photostrip | undefined> {
    if (!db) return undefined;
    return await db.photostrips.get(id);
  }

  /**
   * Get all local photostrips sorted by creation time (newest first).
   */
  static async getPhotostrips(): Promise<Photostrip[]> {
    if (!db) return [];
    return await db.photostrips.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Get all photostrips that have not been synchronized to PocketBase yet.
   */
  static async getUnsyncedPhotostrips(): Promise<Photostrip[]> {
    if (!db) return [];
    return await db.photostrips.where('synced').equals(0).toArray();
  }

  /**
   * Mark a photostrip as synchronized.
   */
  static async markAsSynced(id: string, uploadedAt: Date): Promise<void> {
    if (!db) return;
    await db.photostrips.update(id, {
      synced: true,
      uploadedAt,
    });
  }

  /**
   * Delete a photostrip locally.
   */
  static async deletePhotostrip(id: string): Promise<void> {
    if (!db) return;
    await db.photostrips.delete(id);
  }

  /**
   * Save a custom frame template.
   */
  static async saveFrame(frame: FrameTemplate): Promise<void> {
    if (!db) return;
    await db.frames.put(frame);
  }

  /**
   * Get the current active frame template.
   */
  static async getFrame(id: string = 'current_frame'): Promise<FrameTemplate | undefined> {
    if (!db) return undefined;
    return await db.frames.get(id);
  }

  /**
   * Delete a custom frame template.
   */
  static async deleteFrame(id: string = 'current_frame'): Promise<void> {
    if (!db) return;
    await db.frames.delete(id);
  }

  /**
   * Save camera configuration.
   */
  static async saveCameraSettings(settings: CameraSettings): Promise<void> {
    if (!db) return;
    await db.settings.put(settings);
  }

  /**
   * Get active camera configuration.
   */
  static async getCameraSettings(id: string = 'camera_settings'): Promise<CameraSettings | undefined> {
    if (!db) return undefined;
    return await db.settings.get(id);
  }
}
