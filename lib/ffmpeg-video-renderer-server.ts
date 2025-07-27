// 서버사이드 FFmpeg 기반 비디오 렌더링 엔진 (v1.6.1)

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { VideoScriptResult } from './video-script-generator';

// FFmpeg 바이너리 경로 설정 (시스템에 FFmpeg가 설치되어 있어야 함)
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

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
    this.outputDir = path.join(process.cwd(), 'public', 'videos');
    this.tempDir = path.join(process.cwd(), 'temp', 'video-render');
    
    // 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
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
    const sessionId = Date.now().toString();
    
    console.log('🎥 비디오 렌더링 시작:', {
      sessionId,
      title: request.projectTitle,
      images: request.images.length,
      hasAudio: !!request.audioPath,
      resolution: request.resolution,
      quality: request.quality
    });

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 5,
        currentStep: '렌더링 환경 준비 중...'
      });

      // 1. 임시 작업 디렉토리 생성
      const sessionTempDir = path.join(this.tempDir, sessionId);
      if (!fs.existsSync(sessionTempDir)) {
        fs.mkdirSync(sessionTempDir, { recursive: true });
      }

      // 2. 이미지들을 세션 디렉토리에 복사 및 순서 정렬
      await this.prepareImages(request.images, sessionTempDir, onProgress);

      // 3. 자막 파일 생성
      const subtitlePath = await this.createSubtitleFile(request.videoScript, sessionTempDir);

      // 4. 이미지 시퀀스를 비디오로 변환
      const tempVideoPath = await this.createVideoFromImages(request, sessionTempDir, onProgress);

      // 5. 오디오 추가 (있는 경우)
      let finalVideoPath = tempVideoPath;
      if (request.audioPath) {
        finalVideoPath = await this.addAudioToVideo(request, tempVideoPath, sessionTempDir, onProgress);
      }

      // 6. 자막 추가
      finalVideoPath = await this.addSubtitlesToVideo(request, finalVideoPath, subtitlePath, sessionTempDir, onProgress);

      // 7. 최종 출력 파일로 이동
      const result = await this.finalizeVideo(request, finalVideoPath, sessionId, onProgress);

      // 8. 임시 파일 정리
      await this.cleanupTempFiles(sessionTempDir);

      const processingTime = Date.now() - startTime;
      
      console.log('✅ 비디오 렌더링 완료:', {
        sessionId,
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
      
      // 임시 파일 정리
      try {
        const sessionTempDir = path.join(this.tempDir, sessionId);
        await this.cleanupTempFiles(sessionTempDir);
      } catch (cleanupError) {
        console.warn('임시 파일 정리 실패:', cleanupError);
      }
      
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
   * 이미지들을 임시 디렉토리에 준비
   */
  private async prepareImages(
    imagePaths: string[],
    sessionTempDir: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<void> {
    
    onProgress?.({
      stage: 'preparing',
      progress: 10,
      currentStep: '이미지 파일들을 준비 중...'
    });

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const filename = `image_${String(i + 1).padStart(4, '0')}.jpg`;
      const destPath = path.join(sessionTempDir, filename);
      
      if (fs.existsSync(imagePath)) {
        // 이미지 복사
        fs.copyFileSync(imagePath, destPath);
      } else {
        console.warn(`이미지 파일을 찾을 수 없음: ${imagePath}`);
      }
      
      onProgress?.({
        stage: 'preparing',
        progress: 10 + (i / imagePaths.length) * 15,
        currentStep: `이미지 준비 중... (${i + 1}/${imagePaths.length})`
      });
    }
  }

  /**
   * 자막 파일 생성
   */
  private async createSubtitleFile(
    videoScript: VideoScriptResult,
    sessionTempDir: string
  ): Promise<string> {
    
    const srtContent = this.generateSRTFromScript(videoScript);
    const subtitlePath = path.join(sessionTempDir, 'subtitles.srt');
    
    fs.writeFileSync(subtitlePath, srtContent, 'utf8');
    
    return subtitlePath;
  }

  /**
   * 이미지 시퀀스를 비디오로 변환
   */
  private async createVideoFromImages(
    request: VideoRenderRequest,
    sessionTempDir: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    
    return new Promise((resolve, reject) => {
      onProgress?.({
        stage: 'processing_images',
        progress: 35,
        currentStep: '이미지들을 비디오로 합성 중...'
      });

      const quality = this.qualitySettings[request.quality];
      const [width, height] = request.resolution.split('x').map(Number);
      
      // 각 이미지의 표시 시간 계산
      const totalDuration = request.videoScript.totalDuration;
      const imageDuration = totalDuration / request.images.length;
      
      const outputPath = path.join(sessionTempDir, 'temp_video.mp4');
      const inputPattern = path.join(sessionTempDir, 'image_%04d.jpg');

      ffmpeg()
        .input(inputPattern)
        .inputOptions([
          `-framerate 1/${imageDuration}`, // 이미지당 지속시간
          '-f image2'
        ])
        .videoCodec('libx264')
        .outputOptions([
          `-preset ${quality.preset}`,
          `-crf ${quality.crf}`,
          `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
          `-r ${request.frameRate}`,
          `-t ${totalDuration}`,
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg 명령어:', commandLine);
        })
        .on('progress', (progress) => {
          const progressPercent = Math.min(60, 35 + (progress.percent || 0) * 0.25);
          onProgress?.({
            stage: 'processing_images',
            progress: progressPercent,
            currentStep: `비디오 변환 중... ${Math.round(progress.percent || 0)}%`
          });
        })
        .on('end', () => {
          onProgress?.({
            stage: 'processing_images',
            progress: 60,
            currentStep: '이미지 비디오 변환 완료'
          });
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('이미지->비디오 변환 오류:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 비디오에 오디오 추가
   */
  private async addAudioToVideo(
    request: VideoRenderRequest,
    videoPath: string,
    sessionTempDir: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    
    return new Promise((resolve, reject) => {
      onProgress?.({
        stage: 'adding_audio',
        progress: 65,
        currentStep: '오디오를 비디오에 합성 중...'
      });

      const quality = this.qualitySettings[request.quality];
      const outputPath = path.join(sessionTempDir, 'temp_video_with_audio.mp4');

      ffmpeg()
        .input(videoPath)
        .input(request.audioPath!)
        .videoCodec('copy') // 비디오 스트림 복사 (재인코딩 안함)
        .audioCodec('aac')
        .audioBitrate(quality.audioBitrate)
        .outputOptions(['-shortest']) // 더 짧은 스트림에 맞춤
        .output(outputPath)
        .on('progress', (progress) => {
          const progressPercent = Math.min(80, 65 + (progress.percent || 0) * 0.15);
          onProgress?.({
            stage: 'adding_audio',
            progress: progressPercent,
            currentStep: `오디오 합성 중... ${Math.round(progress.percent || 0)}%`
          });
        })
        .on('end', () => {
          onProgress?.({
            stage: 'adding_audio',
            progress: 80,
            currentStep: '오디오 합성 완료'
          });
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('오디오 합성 오류:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 비디오에 자막 추가
   */
  private async addSubtitlesToVideo(
    request: VideoRenderRequest,
    videoPath: string,
    subtitlePath: string,
    sessionTempDir: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    
    return new Promise((resolve, reject) => {
      onProgress?.({
        stage: 'adding_subtitles',
        progress: 85,
        currentStep: '자막을 비디오에 추가 중...'
      });

      const outputPath = path.join(sessionTempDir, 'final_video.mp4');

      ffmpeg()
        .input(videoPath)
        .outputOptions([
          `-vf subtitles=${subtitlePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}:force_style='Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'`
        ])
        .audioCodec('copy')
        .output(outputPath)
        .on('progress', (progress) => {
          const progressPercent = Math.min(95, 85 + (progress.percent || 0) * 0.10);
          onProgress?.({
            stage: 'adding_subtitles',
            progress: progressPercent,
            currentStep: `자막 추가 중... ${Math.round(progress.percent || 0)}%`
          });
        })
        .on('end', () => {
          onProgress?.({
            stage: 'adding_subtitles',
            progress: 95,
            currentStep: '자막 추가 완료'
          });
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('자막 추가 오류:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 최종 비디오 파일 생성 및 저장
   */
  private async finalizeVideo(
    request: VideoRenderRequest,
    tempVideoPath: string,
    sessionId: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<VideoRenderResult> {
    
    onProgress?.({
      stage: 'finalizing',
      progress: 98,
      currentStep: '최종 비디오 파일 생성 중...'
    });

    // 출력 파일명 생성
    const safeTitle = request.projectTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const filename = `${safeTitle}_${sessionId}.${request.outputFormat}`;
    const outputPath = request.outputPath || path.join(this.outputDir, filename);
    
    // 파일 이동
    fs.copyFileSync(tempVideoPath, outputPath);
    
    // 파일 정보 수집
    const stats = fs.statSync(outputPath);
    
    onProgress?.({
      stage: 'complete',
      progress: 100,
      currentStep: '비디오 렌더링 완료!'
    });

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
  private async cleanupTempFiles(sessionTempDir: string): Promise<void> {
    try {
      if (fs.existsSync(sessionTempDir)) {
        fs.rmSync(sessionTempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('임시 파일 정리 중 오류:', error);
    }
  }

  /**
   * 렌더링 엔진 상태 확인
   */
  async healthCheck(): Promise<{ status: string; engine: string; ffmpegAvailable: boolean }> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        resolve({
          status: err ? 'error' : 'ready',
          engine: 'FFmpeg Native',
          ffmpegAvailable: !err
        });
      });
    });
  }
}

// 싱글톤 인스턴스 생성
export const ffmpegRenderer = new FFmpegVideoRenderer();