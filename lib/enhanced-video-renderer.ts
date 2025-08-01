// 향상된 브라우저 기반 비디오 렌더러
// Canvas API + MediaRecorder + 전환 효과 + 자막 지원

export interface EnhancedVideoOptions {
  images: (File | string)[];
  audioFile?: File | string;
  duration: number; // 각 이미지 표시 시간 (초)
  resolution: { width: number; height: number };
  frameRate: number;
  transitions?: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'zoom';
    duration: number; // 전환 효과 시간 (초)
  };
  subtitles?: Array<{
    text: string;
    startTime: number;
    endTime: number;
    style?: {
      fontSize?: number;
      color?: string;
      backgroundColor?: string;
    };
  }>;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  filters?: {
    brightness?: number; // 0-200
    contrast?: number; // 0-200
    saturation?: number; // 0-200
  };
  onProgress?: (progress: number, message: string) => void;
}

export class EnhancedVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    
    // 오프스크린 캔버스 (전환 효과용)
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false })!;
  }

  async render(options: EnhancedVideoOptions): Promise<{ videoBlob: Blob; duration: number }> {
    const {
      images,
      audioFile,
      duration,
      resolution,
      frameRate,
      transitions = { enabled: true, type: 'fade', duration: 0.5 },
      subtitles = [],
      watermark,
      filters,
      onProgress
    } = options;

    // 캔버스 설정
    this.canvas.width = resolution.width;
    this.canvas.height = resolution.height;
    this.offscreenCanvas.width = resolution.width;
    this.offscreenCanvas.height = resolution.height;

    // 이미지 로드
    onProgress?.(5, '이미지 로딩 중...');
    const loadedImages = await this.loadImages(images);
    
    // 오디오 준비
    let audioTrack: MediaStreamTrack | null = null;
    if (audioFile) {
      onProgress?.(10, '오디오 로딩 중...');
      audioTrack = await this.prepareAudioTrack(audioFile);
    }

    // MediaRecorder 설정
    const stream = this.canvas.captureStream(frameRate);
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    const mimeType = this.getSupportedMimeType();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000 // 5Mbps
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const totalDuration = images.length * duration;
        resolve({ videoBlob, duration: totalDuration });
      };

      mediaRecorder.onerror = (e) => reject(e);
      
      // 렌더링 시작
      mediaRecorder.start(100);
      this.renderSequence(loadedImages, {
        duration,
        frameRate,
        transitions,
        subtitles,
        watermark,
        filters,
        onProgress,
        onComplete: () => mediaRecorder.stop()
      });
    });
  }

  private async loadImages(sources: (File | string)[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(source => this.loadImage(source)));
  }

  private async loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      if (source instanceof File) {
        img.src = URL.createObjectURL(source);
      } else {
        img.src = source;
      }
    });
  }

  private async prepareAudioTrack(audioFile: File | string): Promise<MediaStreamTrack | null> {
    try {
      const audioContext = new AudioContext();
      let arrayBuffer: ArrayBuffer;
      
      if (audioFile instanceof File) {
        arrayBuffer = await audioFile.arrayBuffer();
      } else {
        const response = await fetch(audioFile);
        arrayBuffer = await response.arrayBuffer();
      }
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.start();
      
      return destination.stream.getAudioTracks()[0];
    } catch (error) {
      console.warn('오디오 트랙 생성 실패:', error);
      return null;
    }
  }

  private async renderSequence(
    images: HTMLImageElement[],
    options: {
      duration: number;
      frameRate: number;
      transitions: any;
      subtitles: any[];
      watermark?: any;
      filters?: any;
      onProgress?: (progress: number, message: string) => void;
      onComplete: () => void;
    }
  ) {
    const { duration, frameRate, transitions, subtitles, watermark, filters, onProgress, onComplete } = options;
    const frameDuration = 1000 / frameRate;
    const totalFrames = images.length * duration * frameRate;
    let currentFrame = 0;

    for (let i = 0; i < images.length; i++) {
      const progress = ((i + 1) / images.length) * 80 + 10; // 10-90%
      onProgress?.(progress, `이미지 ${i + 1}/${images.length} 렌더링 중...`);

      const currentImage = images[i];
      const nextImage = images[i + 1];
      const imageFrames = duration * frameRate;
      
      // 전환 효과가 있는 경우
      if (transitions.enabled && nextImage) {
        const transitionFrames = transitions.duration * frameRate;
        const normalFrames = imageFrames - transitionFrames;
        
        // 일반 프레임 렌더링
        for (let f = 0; f < normalFrames; f++) {
          await this.renderFrame(currentImage, {
            time: currentFrame / frameRate,
            subtitles,
            watermark,
            filters
          });
          currentFrame++;
          await this.wait(frameDuration);
        }
        
        // 전환 효과 프레임 렌더링
        for (let f = 0; f < transitionFrames; f++) {
          const progress = f / transitionFrames;
          await this.renderTransition(
            currentImage,
            nextImage,
            progress,
            transitions.type,
            {
              time: currentFrame / frameRate,
              subtitles,
              watermark,
              filters
            }
          );
          currentFrame++;
          await this.wait(frameDuration);
        }
      } else {
        // 전환 효과 없이 렌더링
        for (let f = 0; f < imageFrames; f++) {
          await this.renderFrame(currentImage, {
            time: currentFrame / frameRate,
            subtitles,
            watermark,
            filters
          });
          currentFrame++;
          await this.wait(frameDuration);
        }
      }
    }

    onProgress?.(95, '비디오 생성 마무리 중...');
    await this.wait(500); // 마지막 프레임 처리 대기
    onComplete();
  }

  private renderFrame(
    image: HTMLImageElement,
    options: {
      time: number;
      subtitles: any[];
      watermark?: any;
      filters?: any;
    }
  ) {
    // 배경 지우기
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 필터 적용
    if (options.filters) {
      this.ctx.filter = this.getFilterString(options.filters);
    }
    
    // 이미지 그리기 (contain 방식)
    this.drawImageContain(this.ctx, image);
    
    // 필터 리셋
    this.ctx.filter = 'none';
    
    // 자막 그리기
    this.drawSubtitles(options.time, options.subtitles);
    
    // 워터마크 그리기
    if (options.watermark) {
      this.drawWatermark(options.watermark);
    }
  }

  private renderTransition(
    fromImage: HTMLImageElement,
    toImage: HTMLImageElement,
    progress: number,
    type: 'fade' | 'slide' | 'zoom',
    options: any
  ) {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    switch (type) {
      case 'fade':
        this.renderFadeTransition(fromImage, toImage, progress, options);
        break;
      case 'slide':
        this.renderSlideTransition(fromImage, toImage, progress, options);
        break;
      case 'zoom':
        this.renderZoomTransition(fromImage, toImage, progress, options);
        break;
    }
  }

  private renderFadeTransition(fromImage: HTMLImageElement, toImage: HTMLImageElement, progress: number, options: any) {
    // 첫 번째 이미지 (fade out)
    this.ctx.globalAlpha = 1 - progress;
    this.drawImageContain(this.ctx, fromImage);
    
    // 두 번째 이미지 (fade in)
    this.ctx.globalAlpha = progress;
    this.drawImageContain(this.ctx, toImage);
    
    // 알파 리셋
    this.ctx.globalAlpha = 1;
    
    // 자막과 워터마크
    this.drawSubtitles(options.time, options.subtitles);
    if (options.watermark) {
      this.drawWatermark(options.watermark);
    }
  }

  private renderSlideTransition(fromImage: HTMLImageElement, toImage: HTMLImageElement, progress: number, options: any) {
    const slideDistance = this.canvas.width * progress;
    
    // 첫 번째 이미지 (왼쪽으로 슬라이드)
    this.ctx.save();
    this.ctx.translate(-slideDistance, 0);
    this.drawImageContain(this.ctx, fromImage);
    this.ctx.restore();
    
    // 두 번째 이미지 (오른쪽에서 슬라이드)
    this.ctx.save();
    this.ctx.translate(this.canvas.width - slideDistance, 0);
    this.drawImageContain(this.ctx, toImage);
    this.ctx.restore();
    
    // 자막과 워터마크
    this.drawSubtitles(options.time, options.subtitles);
    if (options.watermark) {
      this.drawWatermark(options.watermark);
    }
  }

  private renderZoomTransition(fromImage: HTMLImageElement, toImage: HTMLImageElement, progress: number, options: any) {
    // 첫 번째 이미지 (zoom out)
    this.ctx.save();
    const scale1 = 1 + progress * 0.2;
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(scale1, scale1);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.ctx.globalAlpha = 1 - progress;
    this.drawImageContain(this.ctx, fromImage);
    this.ctx.restore();
    
    // 두 번째 이미지 (zoom in)
    this.ctx.save();
    const scale2 = 0.8 + progress * 0.2;
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(scale2, scale2);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.ctx.globalAlpha = progress;
    this.drawImageContain(this.ctx, toImage);
    this.ctx.restore();
    
    this.ctx.globalAlpha = 1;
    
    // 자막과 워터마크
    this.drawSubtitles(options.time, options.subtitles);
    if (options.watermark) {
      this.drawWatermark(options.watermark);
    }
  }

  private drawImageContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvasRatio = this.canvas.width / this.canvas.height;
    const imgRatio = img.width / img.height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / imgRatio;
      drawX = 0;
      drawY = (this.canvas.height - drawHeight) / 2;
    } else {
      drawWidth = this.canvas.height * imgRatio;
      drawHeight = this.canvas.height;
      drawX = (this.canvas.width - drawWidth) / 2;
      drawY = 0;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  private drawSubtitles(currentTime: number, subtitles: any[]) {
    const activeSubtitle = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    if (activeSubtitle) {
      const style = activeSubtitle.style || {};
      const fontSize = style.fontSize || 32;
      const color = style.color || 'white';
      const bgColor = style.backgroundColor || 'rgba(0, 0, 0, 0.7)';
      
      this.ctx.font = `bold ${fontSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      
      const x = this.canvas.width / 2;
      const y = this.canvas.height - 50;
      const padding = 10;
      
      // 텍스트 측정
      const metrics = this.ctx.measureText(activeSubtitle.text);
      const textWidth = metrics.width;
      
      // 배경 그리기
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(
        x - textWidth / 2 - padding,
        y - fontSize - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );
      
      // 텍스트 그리기
      this.ctx.fillStyle = color;
      this.ctx.fillText(activeSubtitle.text, x, y);
    }
  }

  private drawWatermark(watermark: any) {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const padding = 20;
    let x = padding;
    let y = padding;
    
    switch (watermark.position) {
      case 'top-right':
        this.ctx.textAlign = 'right';
        x = this.canvas.width - padding;
        break;
      case 'bottom-left':
        this.ctx.textBaseline = 'bottom';
        y = this.canvas.height - padding;
        break;
      case 'bottom-right':
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        x = this.canvas.width - padding;
        y = this.canvas.height - padding;
        break;
    }
    
    this.ctx.fillText(watermark.text, x, y);
  }

  private getFilterString(filters: any): string {
    const parts: string[] = [];
    
    if (filters.brightness !== undefined) {
      parts.push(`brightness(${filters.brightness}%)`);
    }
    if (filters.contrast !== undefined) {
      parts.push(`contrast(${filters.contrast}%)`);
    }
    if (filters.saturation !== undefined) {
      parts.push(`saturate(${filters.saturation}%)`);
    }
    
    return parts.join(' ') || 'none';
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm';
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      HTMLCanvasElement.prototype.captureStream &&
      MediaRecorder &&
      AudioContext
    );
  }
}