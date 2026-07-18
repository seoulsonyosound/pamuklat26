'use client';

import React from 'react';

interface FlashAnimationProps {
  isFlashing: boolean;
  onFlashComplete: () => void;
}

export const FlashAnimation: React.FC<FlashAnimationProps> = ({
  isFlashing,
  onFlashComplete,
}) => {
  if (!isFlashing) return null;

  return (
    <div
      onAnimationEnd={onFlashComplete}
      className="absolute inset-0 bg-white z-40 pointer-events-none animate-flash"
    />
  );
};
export default FlashAnimation;
