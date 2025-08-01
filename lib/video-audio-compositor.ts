// 영상과 음성을 합성하는 통합 컴포지터
// FFmpeg WebAssembly 기반으로 브라우저에서 직접 처리

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoAudioCompositorOptions {
  images: File[] | string[]; // 이미지 파일들
  audioFile?: File | string; // 음성 파일
  imageDuration: number; // 각 이미지 표시 시간 (초)
  outputFormat: 'mp4' | 'webm' | 'avi';
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: 'high' | 'medium' | 'low';
  transitions: boolean; // 페이드 전환 효과
  subtitles?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

export interface CompositorProgress {
  phase: 'loading' | 'processing' | 'rendering' | 'finalizing' | 'complete';
  progress: number; // 0-100
  message: string;
  currentStep?: string;
}

export interface CompositorResult {
  success: boolean;
  videoBlob?: Blob;
  videoUrl?: string;
  duration: number;
  fileSize: number;
  resolution: string;
  format: string;
  processingTime: number;
  error?: string;
}

export class VideoAudioCompositor {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private onProgress?: (progress: CompositorProgress) => void;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  // 진행률 콜백 설정
  setProgressCallback(callback: (progress: CompositorProgress) => void) {
    this.onProgress = callback;
  }

  // FFmpeg 초기화
  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    this.reportProgress('loading', 0, 'FFmpeg 라이브러리 로딩 중...');

    try {
      // WebAssembly 기반 FFmpeg 로드
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      this.ffmpeg.on('progress', ({ progress, time }) => {
        if (progress > 0) {
          this.reportProgress('processing', Math.round(progress * 100), 
            `비디오 처리 중... (${Math.round(time / 1000000)}초)`);
        }
      });

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      this.reportProgress('loading', 100, 'FFmpeg 로딩 완료');
    } catch (error) {
      throw new Error(`FFmpeg 초기화 실패: ${error}`);
    }
  }

  // 영상과 음성 합성 메인 함수
  async compose(options: VideoAudioCompositorOptions): Promise<CompositorResult> {
    const startTime = Date.now();

    try {
      await this.initialize();

      this.reportProgress('processing', 5, '파일 준비 중...');

      // 1. 이미지 파일들을 FFmpeg에 업로드
      await this.uploadImages(options.images);

      // 2. 음성 파일 업로드 (있는 경우)
      if (options.audioFile) {
        await this.uploadAudio(options.audioFile);
      }

      this.reportProgress('processing', 20, '이미지 시퀀스 생성 중...');

      // 3. 이미지들로 비디오 생성
      await this.createVideoFromImages(options);

      this.reportProgress('rendering', 60, '영상과 음성 합성 중...');

      // 4. 음성과 합성 (음성 파일이 있는 경우)
      if (options.audioFile) {
        await this.mergeVideoWithAudio(options);
      }

      this.reportProgress('finalizing', 90, '최종 파일 생성 중...');

      // 5. 결과 파일 읽기
      const outputFileName = `output.${options.outputFormat}`;
      const data = await this.ffmpeg.readFile(outputFileName);
      const videoBlob = new Blob([data], { type: `video/${options.outputFormat}` });
      const videoUrl = URL.createObjectURL(videoBlob);

      // 6. 메타데이터 계산
      const duration = options.images.length * options.imageDuration;
      const processingTime = Date.now() - startTime;

      this.reportProgress('complete', 100, '영상 생성 완료!');

      return {
        success: true,
        videoBlob,
        videoUrl,
        duration,
        fileSize: videoBlob.size,
        resolution: `${options.resolution.width}x${options.resolution.height}`,
        format: options.outputFormat,
        processingTime
      };

    } catch (error) {
      console.error('영상 합성 실패:', error);
      return {
        success: false,
        duration: 0,
        fileSize: 0,
        resolution: '',
        format: options.outputFormat,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  // 이미지 파일들을 FFmpeg에 업로드
  private async uploadImages(images: File[] | string[]): Promise<void> {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileName = `image${String(i + 1).padStart(3, '0')}.jpg`;
      
      if (image instanceof File) {
        await this.ffmpeg.writeFile(fileName, await fetchFile(image));
      } else {
        // URL인 경우
        await this.ffmpeg.writeFile(fileName, await fetchFile(image));
      }
      
      this.reportProgress('processing', 5 + (i / images.length) * 15, 
        `이미지 업로드 중... (${i + 1}/${images.length})`);
    }
  }

  // 음성 파일을 FFmpeg에 업로드
  private async uploadAudio(audioFile: File | string): Promise<void> {
    if (audioFile instanceof File) {
      await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
    } else {
      await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
    }
  }

  // 이미지들로 비디오 생성
  private async createVideoFromImages(options: VideoAudioCompositorOptions): Promise<void> {
    const { resolution, frameRate, imageDuration, quality, outputFormat } = options;
    
    // 품질 설정
    const qualityMap = {
      high: '18',
      medium: '23', 
      low: '28'
    };

    const ffmpegArgs = [
      '-framerate', `${1 / imageDuration}`, // 이미지당 표시 시간
      '-i', 'image%03d.jpg',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', qualityMap[quality],
      '-s', `${resolution.width}x${resolution.height}`,
      '-r', frameRate.toString(),
      '-t', (options.images.length * imageDuration).toString(),
      'temp_video.mp4'
    ];

    await this.ffmpeg.exec(ffmpegArgs);
  }

  // 비디오와 오디오 합성
  private async mergeVideoWithAudio(options: VideoAudioCompositorOptions): Promise<void> {
    const outputFileName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.exec([
      '-i', 'temp_video.mp4',
      '-i', 'audio.mp3',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest', // 짧은 길이에 맞춤
      '-y', // 덮어쓰기
      outputFileName
    ]);
  }

  // 진행률 보고
  private reportProgress(phase: CompositorProgress['phase'], progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({
        phase,
        progress: Math.min(100, Math.max(0, progress)),
        message
      });
    }
  }

  // 리소스 정리
  async cleanup(): Promise<void> {
    try {
      // 임시 파일들 정리
      const files = ['temp_video.mp4', 'audio.mp3', 'output.mp4', 'output.webm', 'output.avi'];
      for (const file of files) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch (e) {
          // 파일이 없으면 무시
        }
      }
      
      // 이미지 파일들 정리
      for (let i = 1; i <= 100; i++) {
        try {
          await this.ffmpeg.deleteFile(`image${String(i).padStart(3, '0')}.jpg`);
        } catch (e) {
          break; // 더 이상 파일이 없음
        }
      }
    } catch (error) {
      console.warn('정리 중 오류:', error);
    }
  }

  // FFmpeg 지원 여부 확인
  static async isSupported(): Promise<boolean> {
    try {
      // SharedArrayBuffer 지원 확인 (FFmpeg.wasm 필수)
      return typeof SharedArrayBuffer !== 'undefined' && 
             typeof WebAssembly !== 'undefined' &&
             'crossOriginIsolated' in window;
    } catch {
      return false;
    }
  }
}

// 편의 함수들
export const createVideoWithAudio = async (
  images: File[],
  audioFile: File,
  options: Partial<VideoAudioCompositorOptions> = {}
): Promise<CompositorResult> => {
  const compositor = new VideoAudioCompositor();
  
  const defaultOptions: VideoAudioCompositorOptions = {
    images,
    audioFile,
    imageDuration: 2, // 각 이미지 2초
    outputFormat: 'mp4',
    resolution: { width: 1080, height: 1920 }, // 세로형 쇼츠
    frameRate: 30,
    quality: 'medium',
    transitions: false,
    ...options
  };

  try {
    return await compositor.compose(defaultOptions);
  } finally {
    await compositor.cleanup();
  }
};

export const createVideoOnly = async (
  images: File[],
  options: Partial<VideoAudioCompositorOptions> = {}
): Promise<CompositorResult> => {
  const compositor = new VideoAudioCompositor();
  
  const defaultOptions: VideoAudioCompositorOptions = {
    images,
    imageDuration: 2,
    outputFormat: 'mp4',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    quality: 'medium',
    transitions: false,
    ...options
  };

  try {
    return await compositor.compose(defaultOptions);
  } finally {
    await compositor.cleanup();
  }
};