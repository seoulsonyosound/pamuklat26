import { pb } from '@/lib/pb';
import { Photostrip } from '@/types';

export class PocketBaseService {
  /**
   * Checks if PocketBase is online and reachable.
   */
  static async checkConnection(): Promise<boolean> {
    try {
      // Use standard fetch with timeout to prevent long hangs when offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const pbUrl = pb.baseUrl;
      const response = await fetch(`${pbUrl}/api/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Upload a locally captured photostrip record and its PNG image.
   */
  static async uploadPhotostrip(photostrip: Photostrip): Promise<void> {
    const formData = new FormData();
    
    // Set the custom ID matching our IndexedDB record
    formData.append('id', photostrip.id);
    formData.append('filename', photostrip.filename);
    formData.append('deviceId', photostrip.deviceId);
    formData.append('createdAt', photostrip.createdAt.toISOString());
    formData.append('uploadedAt', new Date().toISOString());
    formData.append('synced', 'true');

    // Create a File object from the local Blob
    const file = new File([photostrip.imageBlob], photostrip.filename, {
      type: 'image/png',
    });
    formData.append('image', file);

    // Create record in the "photostrips" collection
    await pb.collection('photostrips').create(formData);
  }

  /**
   * Delete a photostrip record from PocketBase.
   */
  static async deletePhotostrip(id: string): Promise<void> {
    try {
      await pb.collection('photostrips').delete(id);
    } catch (error: any) {
      // If it doesn't exist on server (404), treat it as a success
      if (error.status !== 404) {
        throw error;
      }
    }
  }
}
