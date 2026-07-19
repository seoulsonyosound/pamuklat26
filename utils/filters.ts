export interface PhotoboothFilter {
  id: string;
  name: string;
  description: string;
  css: string;
}

export const PHOTOBOOTH_FILTERS: PhotoboothFilter[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Clear, natural camera pass-through',
    css: 'none',
  },
  {
    id: 'vintage_bw',
    name: 'Vintage B&W',
    description: 'Deep contrast monochrome',
    css: 'grayscale(100%) contrast(135%) brightness(95%)',
  },
  {
    id: 'sepia_retro',
    name: 'Sepia Retro',
    description: 'Warm nostalgic tone',
    css: 'sepia(80%) contrast(110%) brightness(95%)',
  },
  {
    id: 'high_contrast_pop',
    name: 'High Contrast Pop',
    description: 'Highly punchy, saturated values',
    css: 'contrast(150%) brightness(105%)',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    description: 'Electric blue and pink tones',
    css: 'hue-rotate(300deg) saturate(160%)',
  },
  {
    id: 'cool_cinematic',
    name: 'Cool Cinematic',
    description: 'Desaturated with blues for a film aesthetic',
    css: 'saturate(85%) hue-rotate(15deg) contrast(110%)',
  },
];

/**
 * Helper to get filter object by ID
 */
export function getFilterById(id: string): PhotoboothFilter {
  return PHOTOBOOTH_FILTERS.find((f) => f.id === id) || PHOTOBOOTH_FILTERS[0];
}
