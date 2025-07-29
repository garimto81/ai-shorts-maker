// FFmpeg 환경 감지 및 대안 시스템
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface FFmpegEnvironment {
  available: boolean;
  version?: string;
  path?: string;
  capabilities: {
    libx264: boolean;
    libfdk_aac: boolean;
    subtitles: boolean;
  };
  recommendedEngine: 'native' | 'wasm' | 'cloud';
  platform: 'local' | 'vercel' | 'netlify' | 'railway' | 'heroku' | 'aws' | 'unknown';
}

export async function detectFFmpegEnvironment(): Promise<FFmpegEnvironment> {
  
  const result: FFmpegEnvironment = {
    available: false,
    capabilities: {
      libx264: false,
      libfdk_aac: false,
      subtitles: false
    },
    recommendedEngine: 'wasm',
    platform: 'unknown'
  };

  // 1. 플랫폼 감지
  result.platform = detectPlatform();
  console.log('🌐 플랫폼 감지:', result.platform);

  // 2. FFmpeg 바이너리 존재 확인
  try {
    const { stdout, stderr } = await execAsync('ffmpeg -version');
    
    if (stdout.includes('ffmpeg version')) {
      result.available = true;
      
      // 버전 추출
      const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
      if (versionMatch) {
        result.version = versionMatch[1];
      }
      
      // 기능 확인
      result.capabilities.libx264 = stdout.includes('--enable-libx264');
      result.capabilities.libfdk_aac = stdout.includes('--enable-libfdk-aac');
      result.capabilities.subtitles = stdout.includes('--enable-libass') || stdout.includes('subtitles');
      
      console.log('✅ FFmpeg 감지 성공:', {
        버전: result.version,
        libx264: result.capabilities.libx264,
        자막지원: result.capabilities.subtitles
      });
    }
    
  } catch (error) {
    console.log('❌ FFmpeg 바이너리 없음:', error);
    result.available = false;
  }

  // 3. 추천 엔진 결정
  result.recommendedEngine = determineRecommendedEngine(result);
  
  return result;
}

function detectPlatform(): FFmpegEnvironment['platform'] {
  // 환경 변수로 플랫폼 감지
  if (process.env.VERCEL) return 'vercel';
  if (process.env.NETLIFY) return 'netlify';
  if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
  if (process.env.DYNO) return 'heroku';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws';
  
  // 로컬 환경 감지
  if (process.env.NODE_ENV === 'development') return 'local';
  
  return 'unknown';
}

function determineRecommendedEngine(env: FFmpegEnvironment): 'native' | 'wasm' | 'cloud' {
  
  // 클라우드 환경에서는 WASM 우선
  if (['vercel', 'netlify', 'aws'].includes(env.platform)) {
    return 'wasm';
  }
  
  // Railway, Heroku에서 FFmpeg 사용 가능하면 native
  if (['railway', 'heroku'].includes(env.platform) && env.available) {
    return 'native';
  }
  
  // 로컬 환경에서 FFmpeg 있으면 native
  if (env.platform === 'local' && env.available) {
    return 'native';
  }
  
  // 기본적으로 WASM
  return 'wasm';
}

/**
 * FFmpeg 대안 설치 안내
 */
export function getFFmpegInstallInstructions(platform: string): string {
  const instructions: Record<string, string> = {
    'local': `
로컬 환경에 FFmpeg 설치:

Windows:
1. https://ffmpeg.org/download.html#build-windows 에서 다운로드
2. PATH 환경변수에 추가

macOS:
brew install ffmpeg

Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg

Docker:
dockerfile에 RUN apt-get install -y ffmpeg 추가
    `,
    
    'railway': `
Railway 환경에 FFmpeg 설치:

nixpacks.toml 파일 생성:
[phases.setup]
nixPkgs = ["ffmpeg"]

또는 Dockerfile 사용:
FROM node:18
RUN apt-get update && apt-get install -y ffmpeg
    `,
    
    'heroku': `
Heroku 환경에 FFmpeg 설치:

Buildpack 추가:
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
    `,
    
    'vercel': `
Vercel 환경:
네이티브 FFmpeg 지원하지 않음
WebAssembly 버전만 사용 가능
    `,
    
    'netlify': `
Netlify 환경:
네이티브 FFmpeg 지원하지 않음  
WebAssembly 버전만 사용 가능
    `
  };
  
  return instructions[platform] || '해당 플랫폼의 설치 방법을 확인해주세요.';
}

/**
 * 환경별 최적 설정 반환
 */
export function getOptimalSettings(env: FFmpegEnvironment) {
  
  const baseSettings = {
    maxImageCount: 50,
    maxDuration: 300, // 5분
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp4']
  };
  
  switch (env.platform) {
    case 'vercel':
    case 'netlify':
      return {
        ...baseSettings,
        maxImageCount: 20,
        maxDuration: 120, // 2분
        maxFileSize: 50 * 1024 * 1024, // 50MB
        timeout: 30000 // 30초
      };
      
    case 'railway':
    case 'heroku':
      return {
        ...baseSettings,
        maxImageCount: 30,
        maxDuration: 180, // 3분
        timeout: 120000 // 2분
      };
      
    case 'local':
      return {
        ...baseSettings,
        maxImageCount: 100,
        maxDuration: 600, // 10분
        timeout: 300000 // 5분
      };
      
    default:
      return baseSettings;
  }
}