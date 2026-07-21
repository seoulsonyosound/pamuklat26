import { supabase } from '@/lib/supabase';
import { Photostrip, FrameTemplate } from '@/types';

export class SupabaseService {
  /**
   * Checks if Supabase is online and reachable.
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('photostrips').select('id').limit(1);
      if (error) {
        if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload a locally captured photostrip record and its PNG image.
   */
  static async uploadPhotostrip(photostrip: Photostrip): Promise<void> {
    const file = new File([photostrip.imageBlob], photostrip.filename, {
      type: 'image/png',
    });

    // 1. Upload the image blob to Supabase Storage in "gallery" bucket
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(photostrip.filename, file, {
        cacheControl: '0',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload photostrip image to storage: ${uploadError.message}`);
    }

    // 2. Get public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(photostrip.filename);

    // 3. Create/Upsert record in the "photostrips" table
    const { error: insertError } = await supabase.from('photostrips').upsert({
      id: photostrip.id,
      filename: photostrip.filename,
      device_id: photostrip.deviceId,
      selected_filter_id: photostrip.selectedFilterId || 'normal',
      selected_frame_id: photostrip.selectedFrameId || null,
      created_at: photostrip.createdAt.toISOString(),
      uploaded_at: new Date().toISOString(),
      image_url: publicUrl,
    });

    if (insertError) {
      // Cleanup uploaded file on DB insert failure
      await supabase.storage.from('gallery').remove([photostrip.filename]);
      throw new Error(`Failed to insert photostrip database record: ${insertError.message}`);
    }
  }

  /**
   * Delete a photostrip record and its image from Supabase.
   */
  static async deletePhotostrip(id: string): Promise<void> {
    // 1. Get the filename to delete from storage
    const { data, error: selectError } = await supabase
      .from('photostrips')
      .select('filename')
      .eq('id', id)
      .maybeSingle();

    if (selectError || !data) {
      return;
    }

    const filename = data.filename;

    // 2. Delete from database table
    const { error: deleteDbError } = await supabase
      .from('photostrips')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      throw new Error(`Failed to delete photostrip database record: ${deleteDbError.message}`);
    }

    // 3. Delete from storage bucket
    if (filename) {
      const { error: deleteStorageError } = await supabase.storage
        .from('gallery')
        .remove([filename]);
        
      if (deleteStorageError) {
        console.warn(`Failed to delete photostrip file from storage: ${deleteStorageError.message}`);
      }
    }
  }

  /**
   * Upload a custom border frame template and its PNG image.
   */
  static async uploadFrame(frame: FrameTemplate): Promise<void> {
    const file = new File([frame.imageBlob], frame.filename, {
      type: 'image/png',
    });

    // 1. Upload the frame image blob to Supabase Storage in "frames" bucket
    const { error: uploadError } = await supabase.storage
      .from('frames')
      .upload(frame.filename, file, {
        cacheControl: '0',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload frame image to storage: ${uploadError.message}`);
    }

    // 2. Get public URL of the uploaded frame
    const { data: { publicUrl } } = supabase.storage
      .from('frames')
      .getPublicUrl(frame.filename);

    // 3. Create/Upsert record in the "frames" table
    const { error: insertError } = await supabase.from('frames').upsert({
      id: frame.id,
      filename: frame.filename,
      created_at: frame.createdAt.toISOString(),
      is_active: frame.isActive !== undefined ? frame.isActive : true,
      image_url: publicUrl,
    });

    if (insertError) {
      // Cleanup uploaded file on DB insert failure
      await supabase.storage.from('frames').remove([frame.filename]);
      throw new Error(`Failed to insert frame database record: ${insertError.message}`);
    }
  }

  /**
   * Delete a custom frame template and its image from Supabase.
   */
  static async deleteFrame(id: string): Promise<void> {
    // 1. Get the filename to delete from storage
    const { data, error: selectError } = await supabase
      .from('frames')
      .select('filename')
      .eq('id', id)
      .maybeSingle();

    if (selectError || !data) {
      return;
    }

    const filename = data.filename;

    // 2. Delete from database table
    const { error: deleteDbError } = await supabase
      .from('frames')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      throw new Error(`Failed to delete frame database record: ${deleteDbError.message}`);
    }

    // 3. Delete from storage bucket
    if (filename) {
      const { error: deleteStorageError } = await supabase.storage
        .from('frames')
        .remove([filename]);

      if (deleteStorageError) {
        console.warn(`Failed to delete frame file from storage: ${deleteStorageError.message}`);
      }
    }
  }
}
