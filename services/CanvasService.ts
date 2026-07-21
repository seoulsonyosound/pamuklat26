export class CanvasService {
  private static CANVAS_WIDTH = 800;
  private static CANVAS_HEIGHT = 2400;
  
  // Dimensions for individual photos on the strip (4:3 aspect ratio)
  private static PHOTO_WIDTH = 700;
  private static PHOTO_HEIGHT = 525;
  private static HORIZONTAL_MARGIN = 50; // (800 - 700) / 2
  private static VERTICAL_MARGIN = 50; // Top margin
  private static PHOTO_GAP = 40; // Gap between photos

  /**
   * Helper to load a Blob into an HTMLImageElement safely.
   */
  private static loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image source: ' + String(err)));
      };
      
      img.src = objectUrl;
    });
  }

  /**
   * Draws an image onto the canvas context mimicking `object-fit: cover`.
   * Prevents squashing/stretching when camera aspect ratio != 4:3.
   */
  private static drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgRatio > targetRatio) {
      // Source image is wider than target ratio
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else if (imgRatio < targetRatio) {
      // Source image is taller than target ratio
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  /**
   * Combines 4 photo Blobs into a single vertical photostrip (800x2400px).
   * Overlays the custom PNG frame (if provided); otherwise, draws a premium default frame.
   * Applies filterCss to photo layers and draws stickers on top.
   */
  static async generatePhotostrip(
    photos: Blob[],
    customFrameBlob: Blob | null = null,
    filterCss: string = 'none',
    stickers: Array<{
      id: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      previewWidth?: number;
      previewHeight?: number;
    }> = []
  ): Promise<Blob> {
    if (photos.length !== 4) {
      throw new Error('Photostrip generation requires exactly 4 photos.');
    }

    // 1. Create canvas and context
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D canvas context.');
    }

    // 2. Load all 4 photos concurrently (and frame if provided)
    const imagePromises = photos.map((photoBlob) => this.loadBlobAsImage(photoBlob));
    const framePromise = customFrameBlob ? this.loadBlobAsImage(customFrameBlob) : null;

    const images = await Promise.all(imagePromises);
    const frameImg = framePromise ? await framePromise : null;

    if (frameImg) {
      // === CUSTOM FRAME PATH ===
      // Step 1: White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

      // Step 2: Draw custom frame background
      ctx.drawImage(frameImg, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

      // Step 3: Draw photos with filter applied ON TOP of frame
      if (filterCss && filterCss !== 'none') {
        ctx.filter = filterCss;
      }

      for (let i = 0; i < 4; i++) {
        const y =
          this.VERTICAL_MARGIN +
          i * (this.PHOTO_HEIGHT + this.PHOTO_GAP);
        
        this.drawImageCover(
          ctx,
          images[i],
          this.HORIZONTAL_MARGIN,
          y,
          this.PHOTO_WIDTH,
          this.PHOTO_HEIGHT
        );
      }
      ctx.filter = 'none';

      // Draw the capture date on the bottom-right of the custom frame
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 20px "Outfit", "Inter", sans-serif';
      
      const dateText = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.');
      
      // 1. Draw a dark outline to ensure contrast on yellow/white frames
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(dateText, 750, 2370);

      // 2. Fill with white text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(dateText, 750, 2370);
      
      ctx.restore();
    } else {
      // === DEFAULT FRAME PATH (no custom frame) ===
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

      // Draw the 4 photos with filter
      if (filterCss && filterCss !== 'none') {
        ctx.filter = filterCss;
      }

      for (let i = 0; i < 4; i++) {
        const y =
          this.VERTICAL_MARGIN +
          i * (this.PHOTO_HEIGHT + this.PHOTO_GAP);
        
        this.drawImageCover(
          ctx,
          images[i],
          this.HORIZONTAL_MARGIN,
          y,
          this.PHOTO_WIDTH,
          this.PHOTO_HEIGHT
        );
      }
      ctx.filter = 'none';

      // Draw default frame borders and text on top
      this.drawDefaultFrame(ctx);
    }

    // Step 4: Draw Interactive Stickers on top of photostrip
    if (stickers && stickers.length > 0) {
      for (const sticker of stickers) {
        try {
          const stickerImg = await this.loadBlobAsImage(await (await fetch(sticker.url)).blob());
          const pW = sticker.previewWidth || 280;
          const pH = sticker.previewHeight || 840;
          const scaleX = this.CANVAS_WIDTH / pW;
          const scaleY = this.CANVAS_HEIGHT / pH;

          const destX = sticker.x * scaleX;
          const destY = sticker.y * scaleY;
          const destW = sticker.width * scaleX;
          const destH = sticker.height * scaleY;

          ctx.save();
          ctx.translate(destX + destW / 2, destY + destH / 2);
          if (sticker.rotation) {
            ctx.rotate((sticker.rotation * Math.PI) / 180);
          }
          ctx.drawImage(stickerImg, -destW / 2, -destH / 2, destW, destH);
          ctx.restore();
        } catch (err) {
          console.warn('Failed to draw sticker onto canvas:', err);
        }
      }
    }

    // 5. Export to Blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to export photostrip canvas to Blob.'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  /**
   * Draws a premium default frame with elegant borders and text branding at the bottom.
   */
  private static drawDefaultFrame(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Draw elegant borders around each photo
    ctx.strokeStyle = '#E2E8F0'; // Slate 200 border
    ctx.lineWidth = 4;
    
    for (let i = 0; i < 4; i++) {
      const y =
        this.VERTICAL_MARGIN +
        i * (this.PHOTO_HEIGHT + this.PHOTO_GAP);
      
      ctx.strokeRect(
        this.HORIZONTAL_MARGIN,
        y,
        this.PHOTO_WIDTH,
        this.PHOTO_HEIGHT
      );
    }

    // 2. Draw bottom branding text
    const bottomTextY = this.CANVAS_HEIGHT - 65;
    
    // Draw event brand name
    ctx.fillStyle = '#0F172A'; // Slate 900
    ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SSITE PHOTOBOOTH', this.CANVAS_WIDTH / 2, bottomTextY);

    // Draw secondary small footer
    ctx.fillStyle = '#64748B'; // Slate 500
    ctx.font = '500 20px "Outfit", "Inter", sans-serif';
    ctx.fillText('Captured with ❤️ • Offline-First', this.CANVAS_WIDTH / 2, bottomTextY + 40);

    ctx.restore();
  }
}
