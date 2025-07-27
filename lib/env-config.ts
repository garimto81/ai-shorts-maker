// 환경변수 설정 및 검증 시스템

import { z } from 'zod';

// 환경변수 스키마 정의 (Gemini 통합 아키텍처)
const envSchema = z.object({
  // AI API 키 (Gemini 통합)
  GEMINI_API_KEY: z.string().min(30, 'Gemini API 키는 최소 30자 이상이어야 합니다'),
  // ❌ 제거된 AI 서비스들 (v1.4.0)
  // AZURE_SPEECH_KEY: z.string().min(20, 'Azure Speech 키가 필요합니다'),
  // AZURE_SPEECH_REGION: z.string().default('koreacentral'),
  // OPENAI_API_KEY: z.string().startsWith('sk-', 'OpenAI API 키는 sk-로 시작해야 합니다'),

  // 데이터베이스
  DATABASE_URL: z.string().url('올바른 데이터베이스 URL이 필요합니다'),

  // 파일 저장소
  UPLOAD_DIR: z.string().default('./public/uploads'),
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),

  // AWS S3 (선택사항)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-northeast-2'),
  AWS_S3_BUCKET: z.string().optional(),

  // 애플리케이션 설정
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('AI_SHORTS_INTERNAL'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.4'),

  // 보안
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth 시크릿은 최소 32자 이상이어야 합니다'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  API_ENCRYPTION_KEY: z.string().length(32, '암호화 키는 정확히 32자여야 합니다'),

  // 성능 제한
  MAX_CONCURRENT_JOBS: z.coerce.number().int().min(1).max(10).default(3),
  MAX_IMAGES_PER_PROJECT: z.coerce.number().int().min(5).max(50).default(20),
  MAX_VIDEO_DURATION: z.coerce.number().int().min(15).max(300).default(60),

  // 파일 크기 제한 (MB)
  MAX_IMAGE_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  MAX_TOTAL_SIZE: z.coerce.number().int().min(50).max(1000).default(200),

  // 로깅
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  ENABLE_ERROR_TRACKING: z.coerce.boolean().default(true),
});

// 환경변수 타입 추론
export type EnvConfig = z.infer<typeof envSchema>;

// 환경변수 파싱 및 검증
function parseEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`환경변수 설정 오류:\n${missingVars}\n\n.env.local 파일을 확인해주세요.`);
    }
    throw error;
  }
}

// 환경변수 객체 생성
export const env = parseEnv();

// 환경별 설정
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';

// API 키 마스킹 함수
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '***';
  return `${key.slice(0, 8)}***${key.slice(-4)}`;
}

// 환경변수 상태 확인 (Gemini 통합)
export function getEnvStatus() {
  return {
    geminiAI: env.GEMINI_API_KEY ? `✅ ${maskApiKey(env.GEMINI_API_KEY)} (통합 AI 엔진)` : '❌ 미설정',
    // ❌ 제거된 서비스들
    // azure: env.AZURE_SPEECH_KEY ? maskApiKey(env.AZURE_SPEECH_KEY) : '❌ 미설정',
    // openai: env.OPENAI_API_KEY ? maskApiKey(env.OPENAI_API_KEY) : '❌ 미설정',
    database: env.DATABASE_URL ? '✅ 설정됨' : '❌ 미설정',
    storage: env.STORAGE_TYPE,
    environment: env.NODE_ENV,
    architecture: 'Gemini 단일 엔진',
    aiFeatures: '이미지분석+스크립트생성+TTS+음성합성',
    maxImages: env.MAX_IMAGES_PER_PROJECT,
    maxDuration: env.MAX_VIDEO_DURATION,
  };
}

// 필수 환경변수 확인 (Gemini 통합 아키텍처)
export function validateRequiredEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Gemini API 키만 필수로 검증
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    errors.push('GEMINI_API_KEY가 설정되지 않았습니다 (모든 AI 기능에 필수)');
  }

  // ❌ 제거된 API 키 검증
  // if (!env.AZURE_SPEECH_KEY || env.AZURE_SPEECH_KEY === 'your_azure_speech_key_here') {
  //   errors.push('AZURE_SPEECH_KEY가 설정되지 않았습니다');
  // }
  // if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  //   errors.push('OPENAI_API_KEY가 설정되지 않았습니다');
  // }

  if (!env.DATABASE_URL || env.DATABASE_URL.includes('username:password')) {
    errors.push('DATABASE_URL이 올바르게 설정되지 않았습니다');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 시스템 시작 시 환경변수 검증 (Gemini 통합)
export async function initializeEnvironment(): Promise<void> {
  console.log('🔧 환경변수 검증 중... (Gemini 통합 아키텍처)');
  
  const validation = validateRequiredEnv();
  
  if (!validation.valid) {
    console.error('❌ 환경변수 설정 오류:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n📝 해결 방법 (v1.4.0 Gemini 통합):');
    console.error('  1. .env.example을 복사하여 .env.local 생성');
    console.error('  2. GEMINI_API_KEY만 설정하면 모든 AI 기능 사용 가능');
    console.error('  3. Azure/OpenAI 키는 더 이상 필요하지 않음');
    console.error('  4. 서버 재시작');
    throw new Error('Gemini API 키 설정이 완료되지 않았습니다');
  }

  console.log('✅ 환경변수 검증 완료 (Gemini 통합 아키텍처)');
  
  if (isDevelopment) {
    console.log('📊 현재 환경 설정 (v1.4.0):');
    const status = getEnvStatus();
    Object.entries(status).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('🎯 AI 통합: Gemini 단일 엔진으로 모든 기능 처리');
  }
}