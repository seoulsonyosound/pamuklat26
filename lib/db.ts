import Dexie, { type Table } from 'dexie';
import { Photostrip, FrameTemplate, CameraSettings } from '@/types';

export class PhotoboothDatabase extends Dexie {
  photostrips!: Table<Photostrip, string>;
  frames!: Table<FrameTemplate, string>;
  settings!: Table<CameraSettings, string>;

  constructor() {
    super('PhotoboothDatabase');
    this.version(1).stores({
      photostrips: 'id, synced, createdAt',
      frames: 'id',
      settings: 'id',
    });
  }
}

let db: PhotoboothDatabase;

if (typeof window !== 'undefined') {
  db = new PhotoboothDatabase();
} else {
  // Safely fallback for SSR environments
  db = null as unknown as PhotoboothDatabase;
}

export { db };
export type { Table };
