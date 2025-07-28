// 브라우저 기반 비디오 렌더러 (Canvas + MediaRecorder API)

export interface BrowserVideoRenderRequest {
  images: string[]; // 이미지 URL 배열
  duration: number; // 각 이미지 표시 시간 (초)
  resolution: { width: number; height: number };
  frameRate: number;
  transitions?: boolean; // 페이드 전환 효과
  subtitles?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

export class BrowserVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    // Canvas 생성
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async render(request: BrowserVideoRenderRequest): Promise<Blob> {
    console.log('🎥 브라우저 비디오 렌더링 시작...');
    
    // Canvas 크기 설정
    this.canvas.width = request.resolution.width;
    this.canvas.height = request.resolution.height;
    
    // 이미지 로드
    const images = await this.loadImages(request.images);
    
    // MediaRecorder 설정
    const stream = this.canvas.captureStream(request.frameRate);
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps
    });
    
    this.recordedChunks = [];
    
    return new Promise((resolve, reject) => {
      this.mediaRecorder!.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm'
        });
        console.log('✅ 브라우저 비디오 렌더링 완료:', {
          size: Math.round(blob.size / 1024) + 'KB',
          type: blob.type
        });
        resolve(blob);
      };
      
      this.mediaRecorder!.onerror = (error) => {
        console.error('❌ MediaRecorder 오류:', error);
        reject(error);
      };
      
      // 녹화 시작
      this.mediaRecorder!.start();
      
      // 이미지 시퀀스 렌더링
      this.renderImageSequence(images, request).then(() => {
        this.mediaRecorder!.stop();
      }).catch(reject);
    });
  }
  
  private async loadImages(urls: string[]): Promise<HTMLImageElement[]> {
    console.log('📸 이미지 로딩 중...');
    const images = await Promise.all(
      urls.map(url => this.loadImage(url))
    );
    console.log(`✅ ${images.length}개 이미지 로드 완료`);
    return images;
  }
  
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS 설정
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`이미지 로드 실패: ${url}`));
      img.src = url;
    });
  }
  
  private async renderImageSequence(
    images: HTMLImageElement[], 
    request: BrowserVideoRenderRequest
  ): Promise<void> {
    const frameDuration = 1000 / request.frameRate; // ms per frame
    const framesPerImage = Math.floor(request.duration * request.frameRate);
    
    for (let i = 0; i < images.length; i++) {
      console.log(`🎬 이미지 ${i + 1}/${images.length} 렌더링 중...`);
      
      for (let frame = 0; frame < framesPerImage; frame++) {
        // 페이드 전환 효과
        if (request.transitions && frame < 10 && i > 0) {
          // 이전 이미지와 현재 이미지 블렌딩
          const alpha = frame / 10;
          this.drawImage(images[i - 1], 1 - alpha);
          this.drawImage(images[i], alpha);
        } else {
          this.drawImage(images[i], 1);
        }
        
        // 자막 렌더링
        if (request.subtitles) {
          const currentTime = (i * request.duration) + (frame / request.frameRate);
          this.renderSubtitles(request.subtitles, currentTime);
        }
        
        // 프레임 대기
        await this.delay(frameDuration);
      }
    }
  }
  
  private drawImage(image: HTMLImageElement, alpha: number = 1): void {
    this.ctx.globalAlpha = alpha;
    
    // 이미지를 캔버스에 맞게 스케일링 (aspect ratio 유지)
    const scale = Math.min(
      this.canvas.width / image.width,
      this.canvas.height / image.height
    );
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (this.canvas.width - scaledWidth) / 2;
    const y = (this.canvas.height - scaledHeight) / 2;
    
    // 배경 클리어
    if (alpha === 1) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 이미지 그리기
    this.ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    
    this.ctx.globalAlpha = 1;
  }
  
  private renderSubtitles(
    subtitles: Array<{ text: string; startTime: number; endTime: number }>,
    currentTime: number
  ): void {
    const activeSubtitle = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    if (activeSubtitle) {
      // 자막 스타일
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 3;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      
      const x = this.canvas.width / 2;
      const y = this.canvas.height - 50;
      
      // 텍스트 그림자 (검은 테두리)
      this.ctx.strokeText(activeSubtitle.text, x, y);
      // 흰색 텍스트
      this.ctx.fillText(activeSubtitle.text, x, y);
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // WebM을 MP4로 변환 (선택사항 - 서버에서 처리)
  async convertToMp4(webmBlob: Blob): Promise<Blob> {
    console.log('🔄 MP4 변환은 서버에서 처리해야 합니다.');
    // 실제 변환은 서버의 FFmpeg를 사용해야 함
    return webmBlob;
  }
}