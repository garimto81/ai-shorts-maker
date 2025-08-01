// 브라우저 기반 비디오 렌더러 (Canvas + MediaRecorder API + 음성 지원)

export interface BrowserVideoRenderRequest {
  images: string[] | File[]; // 이미지 URL 또는 파일 배열
  audioFile?: File | string; // 음성 파일
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
  onProgress?: (progress: number, message: string) => void;
}

export interface BrowserRenderResult {
  success: boolean;
  videoBlob?: Blob;
  videoUrl?: string;
  duration: number;
  fileSize: number;
  error?: string;
}

export class BrowserVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    // Canvas 생성
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async render(request: BrowserVideoRenderRequest): Promise<BrowserRenderResult> {
    console.log('🎥 브라우저 비디오 렌더링 시작...');
    
    try {
      // Canvas 설정
      this.setupCanvas(request.resolution);
      
      // 음성 파일 로드 (있는 경우)
      if (request.audioFile) {
        await this.loadAudio(request.audioFile);
        request.onProgress?.(10, '음성 파일 로딩 완료');
      }

      // 이미지들을 로드하고 렌더링
      const videoBlob = await this.renderVideoWithAudio(request);
      
      const videoUrl = URL.createObjectURL(videoBlob);
      const duration = request.images.length * request.duration;

      request.onProgress?.(100, '렌더링 완료!');

      return {
        success: true,
        videoBlob,
        videoUrl,
        duration,
        fileSize: videoBlob.size
      };

    } catch (error) {
      console.error('브라우저 렌더링 실패:', error);
      return {
        success: false,
        duration: 0,
        fileSize: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  private setupCanvas(resolution: { width: number; height: number }) {
    this.canvas.width = resolution.width;
    this.canvas.height = resolution.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, resolution.width, resolution.height);
  }

  private async loadAudio(audioFile: File | string): Promise<void> {
    this.audioContext = new AudioContext();
    
    let arrayBuffer: ArrayBuffer;
    
    if (audioFile instanceof File) {
      arrayBuffer = await audioFile.arrayBuffer();
    } else {
      const response = await fetch(audioFile);
      arrayBuffer = await response.arrayBuffer();
    }
    
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private async renderVideoWithAudio(request: BrowserVideoRenderRequest): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = this.canvas.captureStream(request.frameRate);
      
      // 음성 트랙 추가 (있는 경우)
      if (this.audioBuffer && this.audioContext) {
        const audioTrack = this.createAudioTrack();
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder 오류'));
      };

      // 렌더링 시작
      this.mediaRecorder.start(100); // 100ms 간격으로 데이터 수집
      this.startImageSequence(request);
    });
  }

  private createAudioTrack(): MediaStreamTrack | null {
    if (!this.audioBuffer || !this.audioContext) return null;

    try {
      // AudioBuffer를 MediaStreamTrack으로 변환
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      
      const destination = this.audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.start();
      
      return destination.stream.getAudioTracks()[0];
    } catch (error) {
      console.warn('오디오 트랙 생성 실패:', error);
      return null;
    }
  }

  private async startImageSequence(request: BrowserVideoRenderRequest): Promise<void> {
    const { images, duration, transitions, subtitles, onProgress } = request;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const progress = ((i + 1) / images.length) * 90; // 90%까지 (나머지 10%는 최종 처리)
      
      onProgress?.(progress, `이미지 ${i + 1}/${images.length} 렌더링 중...`);
      
      // 이미지 로드
      const img = await this.loadImage(image);
      
      // 이미지 그리기
      this.drawImage(img);
      
      // 자막 그리기 (해당 시간대에 있는 경우)
      const currentTime = i * duration;
      this.drawSubtitles(subtitles, currentTime);
      
      // 다음 이미지까지 대기
      if (i < images.length - 1) {
        await this.wait(duration * 1000);
      }
    }

    // 마지막 이미지 표시 시간 대기
    await this.wait(duration * 1000);
    
    // 녹화 중지
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  private async loadImage(imageSource: string | File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      
      if (imageSource instanceof File) {
        img.src = URL.createObjectURL(imageSource);
      } else {
        img.src = imageSource;
      }
    });
  }

  private drawImage(img: HTMLImageElement) {
    const { width, height } = this.canvas;
    
    // 배경 지우기
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);
    
    // 이미지 비율에 맞게 그리기 (contain 방식)
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
      // 이미지가 더 넓음
      drawWidth = width;
      drawHeight = width / imgRatio;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      // 이미지가 더 높음
      drawWidth = height * imgRatio;
      drawHeight = height;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    }
    
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  private drawSubtitles(subtitles: Array<{text: string; startTime: number; endTime: number}> | undefined, currentTime: number) {
    if (!subtitles) return;
    
    const activeSubtitle = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    if (activeSubtitle) {
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 3;
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      
      const x = this.canvas.width / 2;
      const y = this.canvas.height - 100;
      
      // 텍스트 외곽선
      this.ctx.strokeText(activeSubtitle.text, x, y);
      // 텍스트 채우기
      this.ctx.fillText(activeSubtitle.text, x, y);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 리소스 정리
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
    this.recordedChunks = [];
  }

  // 브라우저 지원 여부 확인
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              typeof HTMLCanvasElement.prototype.captureStream !== 'undefined' &&
              MediaRecorder &&
              AudioContext);
  }
}