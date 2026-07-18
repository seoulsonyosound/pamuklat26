import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Memories Event Photobooth',
    short_name: 'Photobooth',
    description: 'Offline-First Photobooth Web Application for capturing school events.',
    start_url: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#090d16',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
