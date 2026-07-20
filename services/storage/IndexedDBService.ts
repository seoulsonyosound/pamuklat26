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
   * Get all photostrips that have not been synchronized to the cloud yet.
   */
  static async getUnsyncedPhotostrips(): Promise<Photostrip[]> {
    if (!db) return [];
    const all = await db.photostrips.toArray();
    return all.filter((strip) => !strip.synced);
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
   * Save a custom frame template into multi-frame collection.
   * Automatically sets the new frame as active and deactivates others.
   */
  static async saveFrame(frame: FrameTemplate): Promise<void> {
    if (!db) return;
    
    // Deactivate all existing frames first
    const allFrames = await db.frames.toArray();
    for (const f of allFrames) {
      await db.frames.update(f.id, { isActive: false });
    }

    // Insert new active frame
    await db.frames.put({
      ...frame,
      isActive: true,
    });
  }

  /**
   * Get all uploaded custom frame templates (newest first).
   */
  static async getAllFrames(): Promise<FrameTemplate[]> {
    if (!db) return [];
    return await db.frames.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Get the current active frame template (if any).
   */
  static async getFrame(id?: string): Promise<FrameTemplate | undefined> {
    if (!db) return undefined;

    if (id) {
      return await db.frames.get(id);
    }

    const frames = await db.frames.toArray();
    if (frames.length === 0) return undefined;

    const active = frames.find((f) => f.isActive);
    if (active) return active;

    // Fallback to latest uploaded frame if no frame is explicitly active
    return frames.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  /**
   * Set a specific frame template as active.
   */
  static async setActiveFrame(id: string): Promise<void> {
    if (!db) return;
    const allFrames = await db.frames.toArray();
    for (const f of allFrames) {
      await db.frames.update(f.id, { isActive: f.id === id });
    }
  }

  /**
   * Delete a custom frame template by ID.
   * If the active frame was deleted, promotes the next available frame to active.
   */
  static async deleteFrame(id: string = 'current_frame'): Promise<void> {
    if (!db) return;

    const target = await db.frames.get(id);
    const wasActive = target?.isActive;

    await db.frames.delete(id);

    if (wasActive) {
      const remaining = await db.frames.toArray();
      if (remaining.length > 0) {
        const nextActive = remaining.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        await db.frames.update(nextActive.id, { isActive: true });
      }
    }
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
