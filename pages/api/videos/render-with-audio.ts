// 서버사이드 FFmpeg를 사용한 영상+음성 합성 API 엔드포인트

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

// FFmpeg 바이너리 경로 설정 (로컬 환경)
if (process.env.NODE_ENV === 'development') {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
    }
  } catch (error) {
    console.warn('FFmpeg static 설정 실패:', error);
  }
}

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface VideoRenderRequest {
  images: string[]; // 임시 업로드된 이미지 경로들
  audioPath?: string; // 음성 파일 경로
  duration: number; // 각 이미지 표시 시간
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: 'high' | 'medium' | 'low';
  outputFormat: 'mp4' | 'webm' | 'avi';
  projectTitle: string;
}

export interface VideoRenderResponse {
  success: boolean;
  videoUrl?: string;
  videoPath?: string;
  duration: number;
  fileSize: number;
  processingTime: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VideoRenderResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      duration: 0,
      fileSize: 0,
      processingTime: 0,
      error: 'POST 방식만 지원됩니다'
    });
  }

  const startTime = Date.now();
  let tempFiles: string[] = [];

  try {
    // 1. 폼 데이터 파싱
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), 'temp', 'video-render')
    });

    // temp 디렉토리 생성
    const tempDir = path.join(process.cwd(), 'temp', 'video-render');
    await mkdir(tempDir, { recursive: true });

    const [fields, files] = await form.parse(req);
    
    // 2. 요청 데이터 추출
    const requestData: VideoRenderRequest = JSON.parse(fields.data?.[0] || '{}');
    
    console.log('🎬 서버사이드 비디오 렌더링 시작:', requestData.projectTitle);

    // 3. 이미지 파일들 처리
    const imageFiles = files.images as formidable.File[];
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('이미지 파일이 필요합니다');
    }

    // 4. 음성 파일 처리 (있는 경우)
    let audioFilePath: string | undefined;
    if (files.audio) {
      const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
      audioFilePath = audioFile.filepath;
      tempFiles.push(audioFilePath);
    }

    // 5. 이미지 파일들을 순서대로 정렬
    const sortedImagePaths = imageFiles
      .sort((a, b) => a.originalFilename!.localeCompare(b.originalFilename!))
      .map(file => {
        tempFiles.push(file.filepath);
        return file.filepath;
      });

    // 6. FFmpeg로 비디오 렌더링
    const outputPath = await renderVideoWithFFmpeg({
      ...requestData,
      images: sortedImagePaths,
      audioPath: audioFilePath
    });

    tempFiles.push(outputPath);

    // 7. 결과 파일 정보
    const stats = fs.statSync(outputPath);
    const duration = requestData.images.length * requestData.duration;
    const processingTime = Date.now() - startTime;

    // 8. 응답 생성
    const videoUrl = `/api/videos/download?path=${encodeURIComponent(outputPath)}`;

    res.status(200).json({
      success: true,
      videoUrl,
      videoPath: outputPath,
      duration,
      fileSize: stats.size,
      processingTime
    });

  } catch (error) {
    console.error('비디오 렌더링 실패:', error);
    
    res.status(500).json({
      success: false,
      duration: 0,
      fileSize: 0,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  } finally {
    // 임시 파일들 정리 (나중에 별도 프로세스에서)
    setTimeout(() => {
      cleanupTempFiles(tempFiles);
    }, 300000); // 5분 후 정리
  }
}

// FFmpeg를 사용한 비디오 렌더링
async function renderVideoWithFFmpeg(request: VideoRenderRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const { images, audioPath, duration, resolution, frameRate, quality, outputFormat, projectTitle } = request;
    
    // 출력 파일 경로
    const timestamp = Date.now();
    const outputPath = path.join(
      process.cwd(), 
      'public', 
      'videos', 
      `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${outputFormat}`
    );

    // public/videos 디렉토리 생성
    const videosDir = path.dirname(outputPath);
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    // 품질 설정
    const qualityMap = {
      high: '18',
      medium: '23',
      low: '28'
    };

    console.log(`🎬 FFmpeg 렌더링 시작: ${images.length}개 이미지, 각 ${duration}초`);

    // FFmpeg 명령어 구성
    let command = ffmpeg();

    // 이미지들을 임시 concat 파일로 만들기
    const concatFilePath = path.join(process.cwd(), 'temp', `concat_${timestamp}.txt`);
    const concatContent = images
      .map(imagePath => `file '${imagePath.replace(/\\/g, '\\\\')}'`)
      .map(line => `${line}\nduration ${duration}`)
      .join('\n') + `\nfile '${images[images.length - 1].replace(/\\/g, '\\\\')}'`; // 마지막 이미지 반복

    fs.writeFileSync(concatFilePath, concatContent);

    command = command
      .input(concatFilePath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-crf', qualityMap[quality],
        '-s', `${resolution.width}x${resolution.height}`,
        '-r', frameRate.toString()
      ]);

    // 음성 파일이 있는 경우 추가
    if (audioPath) {
      command = command
        .input(audioPath)
        .audioCodec('aac')
        .outputOptions(['-shortest']); // 짧은 길이에 맞춤
    } else {
      // 음성이 없는 경우 무음 추가
      command = command.outputOptions(['-an']); // no audio
    }

    command
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg 명령어:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`처리 진행률: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log('✅ FFmpeg 렌더링 완료');
        // concat 파일 정리
        fs.unlinkSync(concatFilePath);
        resolve(outputPath);
      })
      .on('error', (error) => {
        console.error('❌ FFmpeg 렌더링 실패:', error);
        // concat 파일 정리
        try {
          fs.unlinkSync(concatFilePath);
        } catch (e) {
          // 무시
        }
        reject(error);
      })
      .run();
  });
}

// 임시 파일들 정리
async function cleanupTempFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        console.log('🗑️ 임시 파일 삭제:', filePath);
      }
    } catch (error) {
      console.warn('임시 파일 삭제 실패:', filePath, error);
    }
  }
}

// Next.js API 설정
export const config = {
  api: {
    bodyParser: false, // formidable이 처리
    responseLimit: false,
  },
};