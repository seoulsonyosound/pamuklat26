export class CameraService {
  /**
   * Get all video input devices (cameras) connected.
   */
  static async getCameras(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return [];
    }
    
    // Ensure we trigger permissions first if needed to get labels
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.stopStream(stream);
    } catch (err) {
      console.warn('Failed to pre-acquire user media for camera labels:', err);
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
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

    const [width, height] = resolution.split('x').map(Number);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: width ? { ideal: width } : { ideal: 1280 },
        height: height ? { ideal: height } : { ideal: 720 },
      },
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Stop all tracks on the stream.
   */
  static stopStream(stream: MediaStream | null): void {
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
   * Captures a photo from a live Video Element.
   * Renders the current video frame on a canvas at full resolution.
   */
  static async takePhoto(videoElement: HTMLVideoElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context for capture.');
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
