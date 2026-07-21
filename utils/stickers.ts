export interface StickerItem {
  id: number;
  name: string;
  url: string;
}

const ICONIFY_NAME_MAP: Record<string, string> = {
  'cowboy-hat': 'cowboy-hat-face',
  'disguise': 'disguised-face',
  'zap': 'high-voltage',
  'cat-face-with-tears-of-joy': 'cat-with-tears-of-joy',
  'firecrackers': 'firecracker',
};

export const PHOTOBOOTH_STICKERS: StickerItem[] = [
  // Headwear & Props
  'cowboy-hat', 'crown', 'party-popper', 'top-hat', 'graduation-cap',
  'lipstick', 'gem-stone', 'sunglasses', 'disguise', 'goggles',
  
  // Sparkles & FX
  'sparkles', 'glowing-star', 'dizzy', 'fire', 'zap',
  'collision', 'rainbow', 'cloud-with-lightning', 'sparkler', 'balloon',

  // Expressions & Faces
  'grinning-squinting-face', 'face-with-tears-of-joy', 'zany-face', 'smiling-face-with-sunglasses', 'clown-face',
  'exploding-head', 'partying-face', 'smiling-face-with-heart-eyes', 'kissing-face-with-closed-eyes', 'ghost',
  
  // Hearts & Symbols
  'red-heart', 'sparkling-heart', 'revolving-hearts', 'ribbon', 'two-hearts',
  'firecrackers', 'cherry-blossom', 'hibiscus', 'rose', 'sunflower',

  // Fun Extra Props
  'cat-face-with-tears-of-joy', 'alien', 'robot', 'unicorn', 'magic-wand',
  'thumbs-up', 'victory-hand', 'love-you-gesture', 'sign-of-the-horns', 'eyes'
].map((name, index) => {
  const iconifyName = ICONIFY_NAME_MAP[name] || name;
  return {
    id: index + 1,
    name: name.replace(/-/g, ' '),
    url: `https://api.iconify.design/fluent-emoji-flat:${iconifyName}.svg`,
  };
});
