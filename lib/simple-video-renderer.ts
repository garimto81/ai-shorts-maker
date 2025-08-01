// 간단하고 안정적인 비디오 렌더러
export interface SimpleVideoOptions {
  images: File[];
  duration: number; // 각 이미지 표시 시간 (초)
  resolution: { width: number; height: number };
  frameRate: number;
  onProgress?: (progress: number, message: string) => void;
}

export class SimpleVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context를 생성할 수 없습니다.');
    }
    this.ctx = ctx;
  }

  async render(options: SimpleVideoOptions): Promise<{ videoBlob: Blob; videoUrl: string }> {
    const { images, duration, resolution, frameRate, onProgress } = options;
    
    console.log('🎥 비디오 렌더링 시작:', { 
      imageCount: images.length, 
      duration, 
      resolution, 
      frameRate 
    });

    try {
      // 브라우저 지원 확인
      if (!this.checkBrowserSupport()) {
        throw new Error('브라우저가 비디오 생성을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
      }

      // Canvas 설정
      this.canvas.width = resolution.width;
      this.canvas.height = resolution.height;
      
      onProgress?.(5, 'Canvas 설정 완료');

      // 이미지 로드
      onProgress?.(10, '이미지 로딩 중...');
      const loadedImages = await this.loadAllImages(images);
      
      onProgress?.(30, '이미지 로딩 완료');

      // MediaRecorder 설정
      const stream = this.canvas.captureStream(frameRate);
      const mimeType = this.getSupportedMimeType();
      
      console.log('사용할 MIME 타입:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5Mbps
      });

      this.chunks = [];
      
      // 녹화 이벤트 설정
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          console.log('데이터 청크 수집:', event.data.size);
        }
      };

      // 렌더링 완료 대기
      const videoBlob = await new Promise<Blob>((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder가 초기화되지 않았습니다.'));
          return;
        }

        this.mediaRecorder.onstop = () => {
          console.log('녹화 완료, 청크 개수:', this.chunks.length);
          const blob = new Blob(this.chunks, { type: mimeType });
          console.log('최종 비디오 크기:', blob.size);
          resolve(blob);
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder 오류:', event);
          reject(new Error('비디오 녹화 중 오류가 발생했습니다.'));
        };

        // 녹화 시작
        this.mediaRecorder.start(100);
        console.log('녹화 시작');
        
        // 이미지 시퀀스 렌더링
        this.renderImageSequence(loadedImages, duration, frameRate, onProgress)
          .then(() => {
            console.log('이미지 시퀀스 렌더링 완료');
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          })
          .catch(reject);
      });

      const videoUrl = URL.createObjectURL(videoBlob);
      onProgress?.(100, '비디오 생성 완료!');
      
      return { videoBlob, videoUrl };

    } catch (error) {
      console.error('비디오 렌더링 오류:', error);
      throw error;
    }
  }

  private async loadAllImages(files: File[]): Promise<HTMLImageElement[]> {
    return Promise.all(files.map(file => this.loadImage(file)));
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        console.log('이미지 로드 완료:', file.name, `${img.width}x${img.height}`);
        resolve(img);
      };
      
      img.onerror = () => {
        console.error('이미지 로드 실패:', file.name);
        reject(new Error(`이미지 로드 실패: ${file.name}`));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private async renderImageSequence(
    images: HTMLImageElement[],
    duration: number,
    frameRate: number,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    const frameDuration = 1000 / frameRate; // ms
    const framesPerImage = Math.floor(duration * frameRate);
    
    console.log('렌더링 설정:', {
      imagesCount: images.length,
      framesPerImage,
      frameDuration,
      totalFrames: images.length * framesPerImage
    });

    for (let i = 0; i < images.length; i++) {
      const progress = 30 + ((i + 1) / images.length) * 60; // 30-90%
      onProgress?.(progress, `이미지 ${i + 1}/${images.length} 렌더링 중...`);
      
      const image = images[i];
      
      // 각 이미지를 지정된 프레임 수만큼 그리기
      for (let frame = 0; frame < framesPerImage; frame++) {
        this.drawImageOnCanvas(image);
        await this.wait(frameDuration);
      }
    }
    
    onProgress?.(95, '렌더링 마무리 중...');
    // 마지막 프레임을 잠시 더 유지
    await this.wait(500);
  }

  private drawImageOnCanvas(img: HTMLImageElement) {
    const { width: canvasWidth, height: canvasHeight } = this.canvas;
    
    // 배경을 검은색으로 칠하기
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 이미지 비율 계산 (contain 방식)
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
      // 이미지가 더 넓음 - 가로를 맞춤
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      // 이미지가 더 높음 - 세로를 맞춤
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }
    
    // 이미지 그리기
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    // 워터마크 추가
    this.drawWatermark();
  }

  private drawWatermark() {
    this.ctx.save();
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    
    const padding = 10;
    const x = this.canvas.width - padding;
    const y = this.canvas.height - padding;
    
    this.ctx.fillText('AI Shorts Maker', x, y);
    this.ctx.restore();
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder && MediaRecorder.isTypeSupported(type)) {
        console.log('지원되는 MIME 타입 발견:', type);
        return type;
      }
    }
    
    console.warn('지원되는 MIME 타입을 찾을 수 없음, 기본값 사용');
    return 'video/webm';
  }

  private checkBrowserSupport(): boolean {
    const support = {
      mediaDevices: !!navigator.mediaDevices,
      captureStream: !!(HTMLCanvasElement.prototype.captureStream || (HTMLCanvasElement.prototype as any).mozCaptureStream),
      mediaRecorder: !!window.MediaRecorder,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
    
    console.log('브라우저 지원 현황:', support);
    
    return support.captureStream && support.mediaRecorder;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const hasCapture = !!(canvas.captureStream || (canvas as any).mozCaptureStream);
      const hasRecorder = !!window.MediaRecorder;
      
      console.log('SimpleVideoRenderer 지원 확인:', { hasCapture, hasRecorder });
      return hasCapture && hasRecorder;
    } catch (error) {
      console.error('지원 확인 중 오류:', error);
      return false;
    }
  }
}