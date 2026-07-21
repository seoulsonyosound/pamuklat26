import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { URLImage, PlacedSticker } from './URLImage';

interface PhotoSlotProps {
  url?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const PhotoSlotItem: React.FC<PhotoSlotProps> = ({ url, x, y, width, height }) => {
  const [image] = useImage(url || '', 'anonymous');

  if (url && image) {
    return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
  }

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="#f1f5f9"
      stroke="#cbd5e1"
      strokeWidth={1}
      cornerRadius={4}
    />
  );
};

interface StickerCanvasProps {
  photoUrls: string[];
  stickers: PlacedSticker[];
  selectedId: string | null;
  onSelectSticker: (id: string | null) => void;
  onChangeSticker: (sticker: PlacedSticker) => void;
  onDeleteSticker: (id: string) => void;
  stageRef: React.RefObject<any>;
  canvasWidth?: number;
  canvasHeight?: number;
}

export const StickerCanvas: React.FC<StickerCanvasProps> = ({
  photoUrls,
  stickers,
  selectedId,
  onSelectSticker,
  onChangeSticker,
  onDeleteSticker,
  stageRef,
  canvasWidth = 300,
  canvasHeight = 900,
}) => {
  // Listen for Delete or Backspace key presses to remove selected sticker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent backspace from navigating back in browser if focus isn't in an input
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          onDeleteSticker(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onDeleteSticker]);

  // Photo slots layout math inside 300x900 canvas
  const padding = 14;
  const slotWidth = canvasWidth - padding * 2; // 272px
  const slotHeight = Math.round((slotWidth * 3) / 4); // 204px (4:3 ratio)
  const slotGap = 12;

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      ref={stageRef}
      onMouseDown={(e: any) => {
        // Deselect when clicking on empty stage background
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          onSelectSticker(null);
        }
      }}
      onTouchStart={(e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          onSelectSticker(null);
        }
      }}
      className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white"
    >
      {/* Layer 1: Background */}
      <Layer>
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="#ffffff"
        />
      </Layer>

      {/* Layer 2: Captured Photos (4 Slots) */}
      <Layer>
        {Array.from({ length: 4 }).map((_, idx) => {
          const slotY = padding + idx * (slotHeight + slotGap);
          return (
            <PhotoSlotItem
              key={idx}
              url={photoUrls[idx]}
              x={padding}
              y={slotY}
              width={slotWidth}
              height={slotHeight}
            />
          );
        })}
      </Layer>

      {/* Layer 3: Preset Stamps (Studio Logo + Date Stamp) */}
      <Layer>
        {/* Studio Branding at Bottom-Center */}
        <KonvaText
          x={0}
          y={canvasHeight - 38}
          width={canvasWidth}
          align="center"
          text="PAMUKLAT PHOTOBOOTH"
          fontSize={11}
          fontStyle="bold"
          fontFamily="sans-serif"
          fill="#0f172a"
          letterSpacing={1.5}
        />
        <KonvaText
          x={0}
          y={canvasHeight - 22}
          width={canvasWidth}
          align="center"
          text="Captured with ❤️ • Official Event Strip"
          fontSize={8}
          fontFamily="sans-serif"
          fill="#94a3b8"
        />

        {/* Dynamic Date Stamp at Bottom-Right */}
        <KonvaText
          x={canvasWidth - 80}
          y={canvasHeight - 20}
          width={70}
          align="right"
          text={dateStr}
          fontSize={8}
          fontStyle="bold"
          fontFamily="monospace"
          fill="#64748b"
        />
      </Layer>

      {/* Layer 4: Interactive Stickers & Transformers */}
      <Layer>
        {stickers.map((sticker) => (
          <URLImage
            key={sticker.id}
            shapeProps={sticker}
            isSelected={sticker.id === selectedId}
            onSelect={() => onSelectSticker(sticker.id)}
            onChange={(newAttrs) => onChangeSticker(newAttrs)}
          />
        ))}
      </Layer>
    </Stage>
  );
};
