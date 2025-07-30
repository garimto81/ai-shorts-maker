// 브라우저 기반 비디오 렌더러 (Canvas + MediaRecorder API)

export interface BrowserVideoRenderRequest {
  images: string[]; // 이미지 URL 배열
  duration: number; // 각 이미지 표시 시간 (초)
  resolution: { width: number; height: number };
  frameRate: number;
  transitions?: boolean; // 페이드 전환 효과
  maxTotalDuration?: number; // 최대 총 길이 (초) - 쇼츠용 60초 제한
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
    const maxTotalDuration = request.maxTotalDuration || 60; // 기본 60초 제한
    
    console.log('🎬 렌더링 설정:', {
      totalImages: images.length,
      durationPerImage: request.duration,
      maxTotalDuration: maxTotalDuration,
      estimatedTotalDuration: images.length * request.duration
    });
    
    let totalElapsedTime = 0; // 총 경과 시간 추적
    
    for (let i = 0; i < images.length; i++) {
      // 60초 제한 체크
      if (totalElapsedTime >= maxTotalDuration) {
        console.log(`⏱️ 최대 시간(${maxTotalDuration}초) 도달. 렌더링 중단.`);
        break;
      }
      
      console.log(`🎬 이미지 ${i + 1}/${images.length} 렌더링 중... (경과: ${totalElapsedTime.toFixed(1)}초)`);
      
      // 남은 시간 계산
      const remainingTime = maxTotalDuration - totalElapsedTime;
      const actualImageDuration = Math.min(request.duration, remainingTime);
      const actualFramesPerImage = Math.floor(actualImageDuration * request.frameRate);
      
      for (let frame = 0; frame < actualFramesPerImage; frame++) {
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
          const currentTime = totalElapsedTime + (frame / request.frameRate);
          this.renderSubtitles(request.subtitles, currentTime);
        }
        
        // 프레임 대기
        await this.delay(frameDuration);
      }
      
      // 실제 소요된 시간 업데이트
      totalElapsedTime += actualImageDuration;
      
      // 정확히 60초에 도달하면 중단
      if (totalElapsedTime >= maxTotalDuration) {
        console.log(`✅ 정확히 ${maxTotalDuration}초 완료. 렌더링 종료.`);
        break;
      }
    }
    
    console.log(`🎯 렌더링 완료. 총 길이: ${totalElapsedTime.toFixed(1)}초`);
  }
  
  private drawImage(image: HTMLImageElement, alpha: number = 1): void {
    this.ctx.globalAlpha = alpha;
    
    // 배경 클리어
    if (alpha === 1) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 쇼츠용 이미지 크롭 및 스케일링 (전체 화면 채우기)
    const canvasRatio = this.canvas.width / this.canvas.height;
    const imageRatio = image.width / image.height;
    
    let drawWidth, drawHeight, sourceX, sourceY, sourceWidth, sourceHeight;
    
    if (imageRatio > canvasRatio) {
      // 이미지가 더 넓은 경우 - 좌우 크롭
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.height;
      sourceHeight = image.height;
      sourceWidth = sourceHeight * canvasRatio;
      sourceX = (image.width - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // 이미지가 더 높거나 같은 경우 - 상하 크롭 또는 전체 사용
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.height;
      sourceWidth = image.width;
      sourceHeight = sourceWidth / canvasRatio;
      sourceX = 0;
      sourceY = Math.max(0, (image.height - sourceHeight) / 2);
    }
    
    // 이미지 그리기 (크롭된 부분을 전체 캔버스에 맞춤)
    this.ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight, // 소스 영역
      0, 0, drawWidth, drawHeight // 대상 영역
    );
    
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
      // 쇼츠용 자막 스타일 (더 큰 글씨, 화면 하단 1/4 지점)
      const fontSize = Math.max(28, this.canvas.width * 0.04); // 캔버스 너비에 비례한 글씨 크기
      this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = Math.max(2, fontSize * 0.08); // 글씨 크기에 비례한 테두리
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const x = this.canvas.width / 2;
      const y = this.canvas.height * 0.8; // 화면 하단 20% 지점
      
      // 긴 텍스트 처리 (줄바꿈)
      const words = activeSubtitle.text.split(' ');
      const maxWidth = this.canvas.width * 0.9; // 화면 너비의 90%
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = this.ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // 여러 줄 자막 렌더링
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = y - (totalHeight / 2) + (lineHeight / 2);
      
      lines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        
        // 텍스트 그림자 (검은 테두리)
        this.ctx.strokeText(line, x, lineY);
        // 흰색 텍스트
        this.ctx.fillText(line, x, lineY);
      });
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