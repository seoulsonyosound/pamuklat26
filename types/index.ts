export interface Photostrip {
  id: string; // Pre-generated UUID (string) to align with PocketBase
  filename: string;
  imageBlob: Blob; // High-resolution PNG blob
  createdAt: Date;
  uploadedAt: Date | null;
  synced: boolean;
  deviceId: string;
}

export interface FrameTemplate {
  id: string; // "current_frame" or custom ID
  filename: string;
  imageBlob: Blob; // Transparent PNG blob
  createdAt: Date;
}

export interface CameraSettings {
  id: string; // "camera_settings"
  selectedDeviceId: string;
  resolution: string; // e.g. "1280x720"
  updatedAt: Date;
}
