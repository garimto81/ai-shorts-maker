// API 엔드포인트: 비디오 렌더링 (v1.6.0)

import { NextApiRequest, NextApiResponse } from 'next';
import { ffmpegRenderer, VideoRenderRequest } from '@/lib/ffmpeg-video-renderer-server';
import { cloudVideoRenderer, CloudVideoRenderRequest } from '@/lib/ffmpeg-cloud-renderer';
import { mockVideoRenderer } from '@/lib/mock-video-renderer';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// 요청 데이터 검증 스키마
const videoRenderRequestSchema = z.object({
  images: z.array(z.string()).min(1, '최소 1개 이상의 이미지가 필요합니다').max(50, '최대 50개의 이미지만 지원됩니다'),
  audioPath: z.string().optional(),
  videoScript: z.object({
    title: z.string(),
    totalDuration: z.number().min(5).max(60), // 쇼츠 최대 60초 제한
    scenes: z.array(z.any()),
    narration: z.object({
      segments: z.array(z.object({
        startTime: z.number(),
        endTime: z.number(),
        text: z.string()
      }))
    })
  }),
  outputFormat: z.enum(['mp4', 'webm', 'avi']).default('mp4'),
  quality: z.enum(['high', 'medium', 'low']).default('medium'),
  resolution: z.enum(['1080x1920', '720x1280', '540x960']).default('1080x1920'),
  frameRate: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
  projectTitle: z.string().min(1, '프로젝트 제목이 필요합니다')
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 한글 인코딩 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. POST 요청만 지원됩니다.' 
    });
  }

  try {
    // 요청 데이터 검증
    const validatedData = videoRenderRequestSchema.parse(req.body);
    
    console.log('🎥 비디오 렌더링 요청:', {
      projectTitle: validatedData.projectTitle,
      imageCount: validatedData.images.length,
      hasAudio: !!validatedData.audioPath,
      resolution: validatedData.resolution,
      quality: validatedData.quality,
      duration: validatedData.videoScript.totalDuration
    });

    // 이미지 파일 경로 검증 및 변환
    const validatedImages = await validateImagePaths(validatedData.images);
    
    // 오디오 파일 경로 검증 (있는 경우)
    let validatedAudioPath: string | undefined;
    if (validatedData.audioPath) {
      validatedAudioPath = await validateAudioPath(validatedData.audioPath);
    }

    // 렌더링 요청 구성
    const renderRequest: VideoRenderRequest = {
      images: validatedImages,
      audioPath: validatedAudioPath,
      videoScript: validatedData.videoScript as any,
      outputFormat: validatedData.outputFormat,
      quality: validatedData.quality,
      resolution: validatedData.resolution,
      frameRate: validatedData.frameRate,
      projectTitle: validatedData.projectTitle
    };

    // 진행률 추적을 위한 SSE 설정 (선택사항)
    // 현재는 단순 응답으로 구현
    
    // 환경별 렌더러 선택
    const isCloudEnvironment = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const useMockRenderer = isDevelopment && process.env.USE_MOCK_RENDERER !== 'false';
    const startTime = Date.now();
    
    let result;
    if (useMockRenderer) {
      console.log('🎭 개발 환경: Mock 렌더러 사용');
      result = await mockVideoRenderer.render(renderRequest);
    } else if (isCloudEnvironment) {
      console.log('🌐 클라우드 환경 감지: WebAssembly 렌더러 사용');
      
      const cloudRequest: CloudVideoRenderRequest = {
        images: renderRequest.images,
        audioPath: renderRequest.audioPath,
        videoScript: renderRequest.videoScript,
        outputFormat: renderRequest.outputFormat,
        quality: renderRequest.quality,
        resolution: renderRequest.resolution,
        frameRate: renderRequest.frameRate,
        projectTitle: renderRequest.projectTitle,
        outputPath: renderRequest.outputPath
      };
      
      result = await cloudVideoRenderer.renderVideo(cloudRequest, (progress) => {
        console.log(`클라우드 렌더링 진행률: ${progress.stage} - ${progress.progress}% - ${progress.currentStep}`);
      });
    } else {
      console.log('🖥️ 로컬 환경 감지: Native FFmpeg 렌더러 사용');
      
      result = await ffmpegRenderer.renderVideo(renderRequest, (progress) => {
        console.log(`네이티브 렌더링 진행률: ${progress.stage} - ${progress.progress}% - ${progress.currentStep}`);
      });
    }
    
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || '비디오 렌더링에 실패했습니다.',
        processingTime
      });
    }

    console.log('✅ 비디오 렌더링 완료:', {
      videoUrl: result.videoUrl,
      duration: result.duration + '초',
      fileSize: result.fileSize ? Math.round(result.fileSize / 1024 / 1024) + 'MB' : 'N/A',
      processingTime: processingTime + 'ms'
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: {
        videoUrl: result.videoUrl,
        videoPath: 'videoPath' in result ? result.videoPath : undefined,
        duration: result.duration,
        fileSize: result.fileSize,
        resolution: result.resolution,
        frameRate: result.frameRate,
        format: result.format,
        metadata: result.metadata,
        projectTitle: validatedData.projectTitle
      },
      message: '비디오가 성공적으로 렌더링되었습니다.',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: result.processingTime,
        engine: isCloudEnvironment ? 'Cloud WebAssembly' : 'FFmpeg Native',
        version: '1.6.0'
      }
    });

  } catch (error: any) {
    console.error('❌ 비디오 렌더링 API 오류:', error);
    
    // Zod 검증 오류 처리
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      return res.status(400).json({
        success: false,
        error: '입력 데이터가 올바르지 않습니다.',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || '비디오 렌더링 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: 'VIDEO_RENDER_ERROR'
    });
  }
}

/**
 * 이미지 파일 경로들 검증 및 변환
 */
async function validateImagePaths(imagePaths: string[]): Promise<string[]> {
  const validatedPaths: string[] = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    let fullPath: string;
    
    if (imagePath.startsWith('blob:')) {
      // Blob URL인 경우 - 클라이언트에서 업로드된 파일들
      // 실제로는 intelligent-file-sorter에서 FormData로 전송되어야 함
      throw new Error(`Blob URL은 지원하지 않습니다. FormData를 통해 실제 파일을 업로드해주세요.`);
    } else if (imagePath.startsWith('/uploads/')) {
      // 업로드된 파일 경로인 경우 (/uploads/temp/...)
      fullPath = path.join(process.cwd(), 'public', imagePath);
    } else if (imagePath.startsWith('/')) {
      // 기타 웹 URL 경로인 경우 (/test-images/...)
      fullPath = path.join(process.cwd(), 'public', imagePath);
    } else if (imagePath.startsWith('http')) {
      // HTTP URL인 경우 - 현재는 지원하지 않음
      throw new Error(`HTTP URL 이미지는 지원하지 않습니다: ${imagePath}`);
    } else {
      // 상대 경로인 경우
      fullPath = path.resolve(imagePath);
    }
    
    // 파일 존재 확인
    if (!fs.existsSync(fullPath)) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${fullPath}`);
    }
    
    // 이미지 파일 형식 확인
    const ext = path.extname(fullPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
      throw new Error(`지원하지 않는 이미지 형식: ${ext}`);
    }
    
    validatedPaths.push(fullPath);
  }
  
  return validatedPaths;
}

/**
 * 오디오 파일 경로 검증
 */
async function validateAudioPath(audioPath: string): Promise<string> {
  let fullPath: string;
  
  if (audioPath.startsWith('/')) {
    // 웹 URL 경로인 경우
    fullPath = path.join(process.cwd(), 'public', audioPath);
  } else {
    // 상대 경로인 경우
    fullPath = path.resolve(audioPath);
  }
  
  // 파일 존재 확인
  if (!fs.existsSync(fullPath)) {
    throw new Error(`오디오 파일을 찾을 수 없습니다: ${fullPath}`);
  }
  
  // 오디오 파일 형식 확인
  const ext = path.extname(fullPath).toLowerCase();
  if (!['.wav', '.mp3', '.m4a', '.aac', '.ogg'].includes(ext)) {
    throw new Error(`지원하지 않는 오디오 형식: ${ext}`);
  }
  
  return fullPath;
}

// API 설정 (대용량 파일 처리)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // 대용량 이미지 데이터 처리
    },
    responseLimit: false, // 응답 크기 제한 없음
  },
};