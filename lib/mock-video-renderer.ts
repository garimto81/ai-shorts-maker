// Mock 비디오 렌더러 - 개발/테스트용

import { VideoRenderRequest, VideoRenderResult } from './ffmpeg-video-renderer-server';
import path from 'path';
import fs from 'fs';

export class MockVideoRenderer {
  
  async render(request: VideoRenderRequest): Promise<VideoRenderResult> {
    console.log('🎭 Mock 비디오 렌더러 시작...');
    
    const startTime = Date.now();
    
    // 시뮬레이션을 위한 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock 비디오 파일 생성 (실제로는 간단한 텍스트 파일)
    const outputDir = path.join(process.cwd(), 'public/videos/mock');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const filename = `mock-video-${timestamp}.mp4`;
    const filepath = path.join(outputDir, filename);
    const videoUrl = `/videos/mock/${filename}`;
    
    // Mock 파일 내용
    const mockContent = JSON.stringify({
      type: 'mock-video',
      created: new Date().toISOString(),
      request: {
        projectTitle: request.projectTitle,
        imageCount: request.images.length,
        duration: request.videoScript?.totalDuration || 10,
        resolution: request.resolution,
        quality: request.quality
      }
    }, null, 2);
    
    fs.writeFileSync(filepath, mockContent);
    
    const processingTime = Date.now() - startTime;
    
    // Mock 결과 반환
    const result: VideoRenderResult = {
      success: true,
      videoPath: filepath,
      videoUrl: videoUrl,
      duration: request.videoScript?.totalDuration || 10,
      fileSize: mockContent.length,
      resolution: request.resolution || '1280x720',
      frameRate: request.frameRate || 30,
      format: request.outputFormat || 'mp4',
      processingTime: processingTime,
      metadata: {
        totalImages: request.images.length,
        hasAudio: !!request.audioPath,
        hasSubtitles: true,
        scenes: request.videoScript?.scenes?.length || request.images.length,
        quality: request.quality || 'medium'
      }
    };
    
    console.log('✅ Mock 비디오 렌더링 완료:', {
      videoUrl,
      duration: result.duration + '초',
      processingTime: processingTime + 'ms'
    });
    
    return result;
  }
}

export const mockVideoRenderer = new MockVideoRenderer();