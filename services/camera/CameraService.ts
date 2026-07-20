export class CameraService {
  private static cachedStream: MediaStream | null = null;
  private static cachedDeviceId: string | null = null;

  /**
   * Get all video input devices (cameras) connected.
   * If an active stream is provided, uses it for permission context (avoids opening a temp stream).
   */
  static async getCameras(activeStream?: MediaStream): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return [];
    }
    
    let devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');

    // If labels are empty and we don't already have a stream, trigger a permission prompt
    const hasLabels = videoDevices.some((d) => d.label.length > 0);
    if (!hasLabels && videoDevices.length > 0 && !activeStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.stopStreamForce(stream);
      } catch (err) {
        console.warn('Failed to pre-acquire user media for camera labels:', err);
      }
      devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    }

    // If we have an active stream, labels should already be available
    // but re-enumerate just in case
    if (activeStream && !hasLabels) {
      devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    }

    return videoDevices;
  }

  /**
   * Fast-path: Start a stream directly without enumerating devices first.
   * If deviceId is provided, uses { exact: deviceId }.
   * If deviceId is empty/null, opens the browser default camera immediately.
   * Reuses the persistent cached stream across re-entry for zero-lag capture.
   */
  static async startStreamDirect(
    deviceId?: string | null,
    resolution: string = '1280x720'
  ): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Media Devices API is not supported in this browser.');
    }

    const targetDeviceId = deviceId || null;

    // Persistent Stream Reuse: return existing live stream instantly if available
    if (this.cachedStream) {
      const active = this.cachedStream.getVideoTracks().every((t) => t.readyState === 'live');
      if (active) {
        if (!targetDeviceId || this.cachedDeviceId === targetDeviceId) {
          return this.cachedStream;
        }
      }
    }

    // Stop old cached stream if active to prevent multiple camera reservations
    if (this.cachedStream) {
      this.stopStreamForce(this.cachedStream);
      this.cachedStream = null;
    }

    const [width, height] = resolution.split('x').map(Number);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
        width: width ? { ideal: width } : { ideal: 1280 },
        height: height ? { ideal: height } : { ideal: 720 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.cachedStream = stream;
    this.cachedDeviceId = targetDeviceId;
    return stream;
  }

  /**
   * Captures a photo from a live Video Element with optional client-side filter baking.
   * Renders the current video frame on a canvas at full resolution.
   */
  static async takePhoto(
    videoElement: HTMLVideoElement,
    filterCss: string = 'none',
    isMirrored: boolean = false
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context for capture.');
    }

    // Bake filter into canvas context if set
    if (filterCss && filterCss !== 'none') {
      ctx.filter = filterCss;
    }

    // Apply mirroring if requested
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Capture the current frame from video element
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas frame to Blob.'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  /**
   * Starts a webcam stream.
   * If a specific deviceId is provided, it tries to open that camera.
   * Otherwise, it tries to search for a Logitech camera or falls back to the default.
   */
  static async startStream(
    selectedDeviceId: string | null = null,
    resolution: string = '1280x720'
  ): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Media Devices API is not supported in this browser.');
    }

    let deviceId = selectedDeviceId;

    // If no device ID is specified, look for a Logitech device or use default
    if (!deviceId) {
      const cameras = await this.getCameras();
      const logitechCamera = cameras.find((cam) =>
        cam.label.toLowerCase().includes('logitech')
      );
      if (logitechCamera) {
        deviceId = logitechCamera.deviceId;
      } else if (cameras.length > 0) {
        deviceId = cameras[0].deviceId;
      }
    }

    return await this.startStreamDirect(deviceId, resolution);
  }

  /**
   * Stop all tracks on the stream, but KEEP it if it is the cached global stream
   * to ensure instant warm re-entry.
   */
  static stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    
    // Skip stopping if this is the active cache stream - keeps camera hardware warm
    if (stream === this.cachedStream) {
      return;
    }
    
    this.stopStreamForce(stream);
  }

  /**
   * Helper to force shutdown a stream immediately.
   */
  private static stopStreamForce(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (err) {
        console.error('Failed to stop stream track:', err);
      }
    });
  }

  /**
   * Fully release the cached background stream (e.g. for complete teardown)
   */
  static releaseCachedStream(): void {
    if (this.cachedStream) {
      this.stopStreamForce(this.cachedStream);
      this.cachedStream = null;
      this.cachedDeviceId = null;
    }
  }

  /**
   * Synthesize a mechanical camera shutter sound using HTML5 Web Audio API.
   * Completely offline-first, avoids network request latency or missing asset issues.
   */
  static playShutterSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();

      // 1. Synthesize shutter click (high frequency noise)
      const bufferSize = audioCtx.sampleRate * 0.08; // 80ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 3;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      noise.start();

      // 2. Synthesize shutter mechanical slide (short triangle wave frequency drop)
      setTimeout(() => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);

          gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        } catch (err) {
          console.warn('Sub-sound oscillator error:', err);
        }
      }, 35);
    } catch (error) {
      console.warn('Web Audio API shutter sound playback failed:', error);
    }
  }
}
