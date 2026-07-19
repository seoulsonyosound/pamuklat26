export interface Photostrip {
  id: string; // Pre-generated UUID (string) to align with PocketBase
  filename: string;
  imageBlob: Blob; // Compiled high-resolution PNG blob
  rawPhotos?: Blob[]; // Array of the 4 raw camera snapshot Blobs
  selectedFrameId?: string | null;
  selectedFilterId?: string;
  createdAt: Date;
  uploadedAt: Date | null;
  synced: boolean;
  deviceId: string;
}

export interface FrameTemplate {
  id: string; // Unique ID for frame template
  filename: string;
  imageBlob: Blob; // Transparent PNG blob
  createdAt: Date;
  isActive?: boolean; // Indicates active frame status
}

export interface CameraSettings {
  id: string; // "camera_settings"
  selectedDeviceId: string;
  resolution: string; // e.g. "1280x720"
  updatedAt: Date;
}
