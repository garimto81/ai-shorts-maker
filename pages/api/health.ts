// 시스템 건강 상태 확인 API

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ApiCheck {
  service: string;
  valid: boolean;
  error?: string;
  responseTime?: number;
}

interface HealthResponse {
  healthy: boolean;
  timestamp: string;
  apis: ApiCheck[];
  environment: {
    nodeEnv: string;
    platform: string;
    nodeVersion: string;
    maxImages: number;
    maxDuration: number;
    storageType: string;
    ffmpegAvailable: boolean;
  };
  services: {
    database: boolean;
    storage: boolean;
    tts: boolean;
    videoRenderer: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  const startTime = Date.now();
  
  try {
    console.log('🏥 시스템 건강 상태 확인 시작');

    // API 키 상태 확인
    const apiChecks: ApiCheck[] = await Promise.all([
      checkGeminiApi(),
      checkAzureSpeechApi(),
      checkOpenAiApi()
    ]);

    // 환경 정보 수집
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.platform,
      nodeVersion: process.version,
      maxImages: 50,
      maxDuration: 60,
      storageType: 'local',
      ffmpegAvailable: await checkFFmpegAvailability()
    };

    // 서비스 상태 확인
    const services = {
      database: true, // 현재는 파일 기반
      storage: checkStorageHealth(),
      tts: apiChecks.find(api => api.service === 'Azure Speech')?.valid || false,
      videoRenderer: environment.ffmpegAvailable
    };

    // 전체 건강 상태 판정
    const validApis = apiChecks.filter(api => api.valid).length;
    const totalServices = Object.values(services).filter(Boolean).length;
    const healthy = validApis >= 1 && totalServices >= 3; // 최소 1개 API + 3개 서비스

    const response: HealthResponse = {
      healthy,
      timestamp: new Date().toISOString(),
      apis: apiChecks,
      environment,
      services
    };

    const processingTime = Date.now() - startTime;
    console.log(`🏥 건강 상태 확인 완료: ${healthy ? '✅ 정상' : '⚠️ 문제 있음'} (${processingTime}ms)`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ 건강 상태 확인 실패:', error);
    
    return res.status(500).json({
      healthy: false,
      timestamp: new Date().toISOString(),
      apis: [],
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version,
        maxImages: 50,
        maxDuration: 60,
        storageType: 'local',
        ffmpegAvailable: false
      },
      services: {
        database: false,
        storage: false,
        tts: false,
        videoRenderer: false
      }
    });
  }
}

// Gemini API 확인
async function checkGeminiApi(): Promise<ApiCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        service: 'Google Gemini',
        valid: false,
        error: 'API 키가 설정되지 않음',
        responseTime: Date.now() - startTime
      };
    }

    // 간단한 API 테스트 (실제로는 요청을 보내지 않고 키 존재만 확인)
    return {
      service: 'Google Gemini',
      valid: true,
      responseTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      service: 'Google Gemini',
      valid: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Azure Speech API 확인
async function checkAzureSpeechApi(): Promise<ApiCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      return {
        service: 'Azure Speech',
        valid: false,
        error: 'API 키 또는 리전이 설정되지 않음',
        responseTime: Date.now() - startTime
      };
    }

    return {
      service: 'Azure Speech',
      valid: true,
      responseTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      service: 'Azure Speech',
      valid: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// OpenAI API 확인
async function checkOpenAiApi(): Promise<ApiCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        service: 'OpenAI',
        valid: false,
        error: 'API 키가 설정되지 않음',
        responseTime: Date.now() - startTime
      };
    }

    return {
      service: 'OpenAI',
      valid: true,
      responseTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      service: 'OpenAI',
      valid: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// FFmpeg 가용성 확인
async function checkFFmpegAvailability(): Promise<boolean> {
  try {
    // 개발 환경에서는 ffmpeg-static 확인
    if (process.env.NODE_ENV === 'development') {
      try {
        require('ffmpeg-static');
        return true;
      } catch {
        return false;
      }
    }
    
    // 프로덕션 환경에서는 시스템 FFmpeg 확인
    return process.env.FFMPEG_PATH ? fs.existsSync(process.env.FFMPEG_PATH) : false;
  } catch {
    return false;
  }
}

// 스토리지 상태 확인
function checkStorageHealth(): boolean {
  try {
    const requiredDirs = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), 'public', 'temp-uploads'),
      path.join(process.cwd(), 'public', 'videos'),
      path.join(process.cwd(), 'public', 'tts-audio')
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    return true;
  } catch {
    return false;
  }
}