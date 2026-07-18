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
   */
  static async generatePhotostrip(
    photos: Blob[],
    customFrameBlob: Blob | null = null
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

    // 2. Draw background (Premium Pure White)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // 3. Load all 4 photos concurrently
    const images = await Promise.all(
      photos.map((photoBlob) => this.loadBlobAsImage(photoBlob))
    );

    // 4. Draw the 4 photos in their designated vertical slots
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

    // 5. Apply Frame Overlay
    if (customFrameBlob) {
      // Draw custom transparent PNG frame
      const frameImg = await this.loadBlobAsImage(customFrameBlob);
      ctx.drawImage(frameImg, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    } else {
      // Draw a beautiful default frame layout
      this.drawDefaultFrame(ctx);
    }

    // 6. Export to Blob
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
