/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef } from 'react';
import { X, Check, RotateCw, Scaling } from 'lucide-react';

export interface PlacedPreviewSticker {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface InteractiveStickerOverlayProps {
  stickers: PlacedPreviewSticker[];
  selectedId: string | null;
  onSelectSticker: (id: string | null) => void;
  onChangeSticker: (updated: PlacedPreviewSticker) => void;
  onDeleteSticker: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
}

export const InteractiveStickerOverlay: React.FC<InteractiveStickerOverlayProps> = ({
  stickers,
  selectedId,
  onSelectSticker,
  onChangeSticker,
  onDeleteSticker,
  containerWidth,
  containerHeight,
}) => {
  const [dragState, setDragState] = useState<{
    stickerId: string;
    action: 'move' | 'resize' | 'rotate';
    startX: number;
    startY: number;
    initialSticker: PlacedPreviewSticker;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    sticker: PlacedPreviewSticker,
    action: 'move' | 'resize' | 'rotate'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    onSelectSticker(sticker.id);
    setDragState({
      stickerId: sticker.id,
      action,
      startX: e.clientX,
      startY: e.clientY,
      initialSticker: { ...sticker },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const init = dragState.initialSticker;

    if (dragState.action === 'move') {
      const newX = Math.max(-init.width / 2, Math.min(containerWidth - init.width / 2, init.x + dx));
      const newY = Math.max(-init.height / 2, Math.min(containerHeight - init.height / 2, init.y + dy));
      onChangeSticker({
        ...init,
        x: newX,
        y: newY,
      });
    } else if (dragState.action === 'resize') {
      // Uniform proportional aspect-ratio scaling
      const scaleDelta = (dx + dy) / 2;
      const newW = Math.max(25, Math.min(containerWidth, init.width + scaleDelta));
      const newH = Math.max(25, Math.min(containerHeight, init.height + scaleDelta));
      onChangeSticker({
        ...init,
        width: newW,
        height: newH,
      });
    } else if (dragState.action === 'rotate') {
      const centerX = init.x + init.width / 2;
      const centerY = init.y + init.height / 2;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const rad = Math.atan2(mouseY - centerY, mouseX - centerX);
        const deg = Math.round((rad * 180) / Math.PI);
        onChangeSticker({
          ...init,
          rotation: deg,
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDragState(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto overflow-hidden select-none z-20"
      onClick={() => onSelectSticker(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {stickers.map((sticker) => {
        const isSelected = sticker.id === selectedId;
        const rot = sticker.rotation || 0;

        return (
          <div
            key={sticker.id}
            style={{
              position: 'absolute',
              left: `${sticker.x}px`,
              top: `${sticker.y}px`,
              width: `${sticker.width}px`,
              height: `${sticker.height}px`,
              transform: `rotate(${rot}deg)`,
              transformOrigin: 'center center',
              touchAction: 'none',
            }}
            className={`group cursor-grab active:cursor-grabbing ${
              isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent rounded-xl' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSticker(sticker.id);
            }}
            onPointerDown={(e) => handlePointerDown(e, sticker, 'move')}
          >
            {/* Sticker Graphic */}
            <img
              src={sticker.url}
              alt="Prop Sticker"
              className="w-full h-full object-contain pointer-events-none drop-shadow-md"
              draggable={false}
            />

            {/* Selected Control Handles */}
            {isSelected && (
              <>
                {/* Top-Right Control Buttons Group (✓ Lock & X Delete) */}
                <div className="absolute -top-3.5 -right-3.5 flex items-center gap-1 z-30 pointer-events-auto">
                  {/* Lock Placement Checkmark (✓) Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSticker(null); // Locks sticker in place, hides outline & handles
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-115 transition-transform cursor-pointer border border-white"
                    title="Done / Lock Prop Placement"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </button>

                  {/* Delete (X) Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSticker(sticker.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-115 transition-transform cursor-pointer border border-white"
                    title="Remove Prop"
                  >
                    <X className="h-3.5 w-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* 3. Resize Handle (Bottom-Right Circle) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, sticker, 'resize')}
                  className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-30 flex items-center justify-center text-white"
                  title="Drag to Resize Prop"
                >
                  <Scaling className="h-3 w-3" />
                </div>

                {/* 4. Rotate Handle (Bottom-Center Amber Circle) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, sticker, 'rotate')}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30 flex items-center justify-center text-white"
                  title="Drag to Rotate Prop"
                >
                  <RotateCw className="h-3 w-3" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
