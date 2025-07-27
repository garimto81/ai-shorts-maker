// FFmpeg 기반 비디오 렌더링 엔진 (v1.6.0)

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import path from 'path';
import fs from 'fs';
import { VideoScriptResult } from './video-script-generator';

export interface VideoRenderRequest {
  // 입력 데이터
  images: string[]; // 이미지 파일 경로들 (정렬된 순서)
  audioPath?: string; // TTS 생성된 오디오 파일 경로
  videoScript: VideoScriptResult; // 영상화 스크립트 데이터
  
  // 렌더링 설정
  outputFormat: 'mp4' | 'webm' | 'avi';
  quality: 'high' | 'medium' | 'low';
  resolution: '1920x1080' | '1280x720' | '640x360';
  frameRate: 24 | 30 | 60;
  
  // 프로젝트 정보
  projectTitle: string;
  outputPath?: string;
}

export interface VideoRenderResult {
  success: boolean;
  videoPath?: string;
  videoUrl?: string;
  duration: number;
  fileSize?: number; // bytes
  resolution: string;
  frameRate: number;
  format: string;
  processingTime: number;
  metadata: {
    totalImages: number;
    hasAudio: boolean;
    hasSubtitles: boolean;
    scenes: number;
    quality: string;
  };
  error?: string;
}

export interface RenderProgress {
  stage: 'preparing' | 'processing_images' | 'adding_audio' | 'adding_subtitles' | 'finalizing' | 'complete';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
}

export class FFmpegVideoRenderer {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private outputDir: string;
  private tempDir: string;
  
  // 품질별 설정
  private readonly qualitySettings = {
    high: {
      videoBitrate: '5000k',
      audioBitrate: '192k',
      preset: 'medium',
      crf: '18'
    },
    medium: {
      videoBitrate: '2500k',
      audioBitrate: '128k',
      preset: 'fast',
      crf: '23'
    },
    low: {
      videoBitrate: '1000k',
      audioBitrate: '96k',
      preset: 'faster',
      crf: '28'
    }
  };

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.outputDir = path.join(process.cwd(), 'public', 'videos');
    this.tempDir = path.join(process.cwd(), 'temp', 'video-render');
    
    // 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // FFmpeg 로그 설정
    this.ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    this.ffmpeg.on('progress', ({ progress, time }) => {
      console.log(`FFmpeg 진행률: ${Math.round(progress * 100)}% (${time}초)`);
    });
  }

  /**
   * FFmpeg 초기화
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    console.log('🎬 FFmpeg 초기화 시작...');
    
    try {
      // FFmpeg 웹어셈블리 로드
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

      await this.ffmpeg.load({
        coreURL,
        wasmURL,
      });

      this.isLoaded = true;
      console.log('✅ FFmpeg 초기화 완료');
      
    } catch (error) {
      console.error('❌ FFmpeg 초기화 실패:', error);
      throw new Error(`FFmpeg 초기화 실패: ${error}`);
    }
  }

  /**
   * 비디오 렌더링 실행
   */
  async renderVideo(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<VideoRenderResult> {
    
    const startTime = Date.now();
    
    console.log('🎥 비디오 렌더링 시작:', {
      title: request.projectTitle,
      images: request.images.length,
      hasAudio: !!request.audioPath,
      resolution: request.resolution,
      quality: request.quality
    });

    try {
      // 1. FFmpeg 초기화
      await this.initialize();
      
      onProgress?.({
        stage: 'preparing',
        progress: 5,
        currentStep: 'FFmpeg 초기화 및 파일 준비 중...'
      });

      // 2. 입력 파일들을 FFmpeg 파일시스템에 로드
      await this.loadInputFiles(request, onProgress);

      // 3. 이미지 시퀀스를 비디오로 변환
      await this.createVideoFromImages(request, onProgress);

      // 4. 오디오 추가 (있는 경우)
      if (request.audioPath) {
        await this.addAudioToVideo(request, onProgress);
      }

      // 5. 자막 추가
      await this.addSubtitlesToVideo(request, onProgress);

      // 6. 최종 출력 파일 생성
      const result = await this.finalizeVideo(request, onProgress);

      const processingTime = Date.now() - startTime;
      
      console.log('✅ 비디오 렌더링 완료:', {
        duration: result.duration + '초',
        fileSize: result.fileSize ? Math.round(result.fileSize / 1024 / 1024) + 'MB' : 'N/A',
        processingTime: processingTime + 'ms'
      });

      return {
        ...result,
        processingTime
      };

    } catch (error: any) {
      console.error('❌ 비디오 렌더링 실패:', error);
      
      return {
        success: false,
        error: error.message || '비디오 렌더링 중 오류가 발생했습니다.',
        duration: 0,
        resolution: request.resolution,
        frameRate: request.frameRate,
        format: request.outputFormat,
        processingTime: Date.now() - startTime,
        metadata: {
          totalImages: request.images.length,
          hasAudio: !!request.audioPath,
          hasSubtitles: true,
          scenes: request.videoScript.scenes.length,
          quality: request.quality
        }
      };
    }
  }

  /**
   * 입력 파일들을 FFmpeg 파일시스템에 로드
   */
  private async loadInputFiles(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<void> {
    
    onProgress?.({
      stage: 'preparing',
      progress: 10,
      currentStep: '이미지 파일들을 로딩 중...'
    });

    // 이미지 파일들 로드
    for (let i = 0; i < request.images.length; i++) {
      const imagePath = request.images[i];
      const filename = `image_${String(i + 1).padStart(3, '0')}.jpg`;
      
      if (fs.existsSync(imagePath)) {
        await this.ffmpeg.writeFile(filename, await fetchFile(imagePath));
      } else {
        console.warn(`이미지 파일을 찾을 수 없음: ${imagePath}`);
      }
      
      onProgress?.({
        stage: 'preparing',
        progress: 10 + (i / request.images.length) * 15,
        currentStep: `이미지 로딩 중... (${i + 1}/${request.images.length})`
      });
    }

    // 오디오 파일 로드 (있는 경우)
    if (request.audioPath && fs.existsSync(request.audioPath)) {
      await this.ffmpeg.writeFile('audio.wav', await fetchFile(request.audioPath));
      
      onProgress?.({
        stage: 'preparing',
        progress: 30,
        currentStep: '오디오 파일 로딩 완료'
      });
    }
  }

  /**
   * 이미지 시퀀스를 비디오로 변환
   */
  private async createVideoFromImages(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<void> {
    
    onProgress?.({
      stage: 'processing_images',
      progress: 35,
      currentStep: '이미지들을 비디오로 합성 중...'
    });

    const quality = this.qualitySettings[request.quality];
    const [width, height] = request.resolution.split('x');
    
    // 각 이미지의 표시 시간 계산
    const totalDuration = request.videoScript.totalDuration;
    const imageDuration = totalDuration / request.images.length;

    // FFmpeg 명령어 구성
    const ffmpegArgs = [
      '-f', 'image2',
      '-framerate', `${1 / imageDuration}`, // 이미지당 지속시간을 프레임레이트로 변환
      '-i', 'image_%03d.jpg',
      '-c:v', 'libx264',
      '-preset', quality.preset,
      '-crf', quality.crf,
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-r', String(request.frameRate),
      '-t', String(totalDuration),
      '-pix_fmt', 'yuv420p',
      'temp_video.mp4'
    ];

    await this.ffmpeg.exec(ffmpegArgs);
    
    onProgress?.({
      stage: 'processing_images',
      progress: 60,
      currentStep: '이미지 비디오 변환 완료'
    });
  }

  /**
   * 비디오에 오디오 추가
   */
  private async addAudioToVideo(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<void> {
    
    onProgress?.({
      stage: 'adding_audio',
      progress: 65,
      currentStep: '오디오를 비디오에 합성 중...'
    });

    const quality = this.qualitySettings[request.quality];

    // 오디오와 비디오 합성
    await this.ffmpeg.exec([
      '-i', 'temp_video.mp4',
      '-i', 'audio.wav',
      '-c:v', 'copy', // 비디오 스트림 복사 (재인코딩 안함)
      '-c:a', 'aac',
      '-b:a', quality.audioBitrate,
      '-shortest', // 더 짧은 스트림에 맞춤
      'temp_video_with_audio.mp4'
    ]);

    // 임시 파일 정리
    await this.ffmpeg.deleteFile('temp_video.mp4');
    
    onProgress?.({
      stage: 'adding_audio',
      progress: 80,
      currentStep: '오디오 합성 완료'
    });
  }

  /**
   * 비디오에 자막 추가
   */
  private async addSubtitlesToVideo(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<void> {
    
    onProgress?.({
      stage: 'adding_subtitles',
      progress: 85,
      currentStep: '자막을 비디오에 추가 중...'
    });

    // SRT 자막 파일 생성
    const srtContent = this.generateSRTFromScript(request.videoScript);
    await this.ffmpeg.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

    const inputFile = request.audioPath ? 'temp_video_with_audio.mp4' : 'temp_video.mp4';
    
    // 자막 추가
    await this.ffmpeg.exec([
      '-i', inputFile,
      '-vf', 'subtitles=subtitles.srt:force_style=\'Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2\'',
      '-c:a', 'copy',
      'final_video.mp4'
    ]);

    // 임시 파일 정리
    await this.ffmpeg.deleteFile(inputFile);
    
    onProgress?.({
      stage: 'adding_subtitles',
      progress: 95,
      currentStep: '자막 추가 완료'
    });
  }

  /**
   * 최종 비디오 파일 생성 및 저장
   */
  private async finalizeVideo(
    request: VideoRenderRequest,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<VideoRenderResult> {
    
    onProgress?.({
      stage: 'finalizing',
      progress: 98,
      currentStep: '최종 비디오 파일 생성 중...'
    });

    // 최종 비디오 파일 읽기
    const videoData = await this.ffmpeg.readFile('final_video.mp4');
    
    // 출력 파일명 생성
    const timestamp = Date.now();
    const safeTitle = request.projectTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const filename = `${safeTitle}_${timestamp}.${request.outputFormat}`;
    const outputPath = request.outputPath || path.join(this.outputDir, filename);
    
    // 파일 저장
    fs.writeFileSync(outputPath, videoData as Uint8Array);
    
    // 파일 정보 수집
    const stats = fs.statSync(outputPath);
    
    onProgress?.({
      stage: 'complete',
      progress: 100,
      currentStep: '비디오 렌더링 완료!'
    });

    // FFmpeg 파일시스템 정리
    await this.cleanupTempFiles();

    return {
      success: true,
      videoPath: outputPath,
      videoUrl: `/videos/${filename}`,
      duration: request.videoScript.totalDuration,
      fileSize: stats.size,
      resolution: request.resolution,
      frameRate: request.frameRate,
      format: request.outputFormat,
      processingTime: 0, // 상위에서 설정됨
      metadata: {
        totalImages: request.images.length,
        hasAudio: !!request.audioPath,
        hasSubtitles: true,
        scenes: request.videoScript.scenes.length,
        quality: request.quality
      }
    };
  }

  /**
   * 비디오 스크립트를 SRT 자막으로 변환
   */
  private generateSRTFromScript(videoScript: VideoScriptResult): string {
    let srtContent = '';
    let index = 1;

    for (const segment of videoScript.narration.segments) {
      const startTime = this.formatSRTTime(segment.startTime);
      const endTime = this.formatSRTTime(segment.endTime);
      
      srtContent += `${index}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text}\n\n`;
      
      index++;
    }

    return srtContent;
  }

  /**
   * 시간을 SRT 형식으로 변환 (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * 임시 파일들 정리
   */
  private async cleanupTempFiles(): Promise<void> {
    try {
      const tempFiles = [
        'final_video.mp4',
        'temp_video.mp4', 
        'temp_video_with_audio.mp4',
        'audio.wav',
        'subtitles.srt'
      ];

      // 이미지 파일들도 정리
      for (let i = 1; i <= 100; i++) {
        tempFiles.push(`image_${String(i).padStart(3, '0')}.jpg`);
      }

      for (const file of tempFiles) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch (error) {
          // 파일이 없는 경우 무시
        }
      }
    } catch (error) {
      console.warn('임시 파일 정리 중 오류:', error);
    }
  }

  /**
   * 렌더링 엔진 상태 확인
   */
  async healthCheck(): Promise<{ status: string; engine: string; loaded: boolean }> {
    return {
      status: this.isLoaded ? 'ready' : 'not_loaded',
      engine: 'FFmpeg WASM',
      loaded: this.isLoaded
    };
  }
}

// 싱글톤 인스턴스 생성
export const ffmpegRenderer = new FFmpegVideoRenderer();