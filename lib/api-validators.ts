// API 키 검증 시스템 (Gemini 통합 아키텍처 v1.4.0)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';

export interface ApiValidationResult {
  service: string;
  valid: boolean;
  error?: string;
  details?: any;
  optional?: boolean;
}

// Gemini API 키 검증
export async function validateGeminiKey(apiKey?: string): Promise<ApiValidationResult> {
  const keyToTest = apiKey || env.GEMINI_API_KEY;
  
  try {
    if (!keyToTest || keyToTest === 'your_gemini_api_key_here') {
      return {
        service: 'gemini',
        valid: false,
        error: 'API 키가 설정되지 않았습니다'
      };
    }

    const genAI = new GoogleGenerativeAI(keyToTest);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // 간단한 테스트 요청
    const result = await model.generateContent("Hello");
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('API 응답이 비어있습니다');
    }

    return {
      service: 'gemini',
      valid: true,
      details: {
        model: 'gemini-1.5-pro',
        responseLength: text.length
      }
    };
  } catch (error: any) {
    return {
      service: 'gemini',
      valid: false,
      error: error.message || 'API 키 검증 실패'
    };
  }
}

// ❌ Azure Speech API 키 검증 (v1.4.0에서 제거됨 - Gemini TTS로 대체)
function validateAzureSpeechKey(): Promise<ApiValidationResult> {
  return Promise.resolve({
    service: 'azure-speech',
    valid: false,
    error: 'v1.4.0에서 제거됨 - Gemini TTS로 대체',
    optional: true
  });
}

// ❌ OpenAI API 키 검증 (v1.4.0에서 제거됨 - Gemini AI로 통일)
function validateOpenAIKey(): Promise<ApiValidationResult> {
  return Promise.resolve({
    service: 'openai',
    valid: false,
    error: 'v1.4.0에서 제거됨 - Gemini AI로 통일',
    optional: true
  });
}

// 모든 API 키 검증 (Gemini 통합 아키텍처)
export async function validateAllApiKeys(): Promise<ApiValidationResult[]> {
  console.log('🔍 API 키 검증 시작... (Gemini 통합 아키텍처 v1.4.0)');
  
  // Gemini AI만 검증 (통합 AI 엔진)
  const [geminiResult, azureResult, openaiResult] = await Promise.allSettled([
    validateGeminiKey(),
    validateAzureSpeechKey(),
    validateOpenAIKey()
  ]);

  const results: ApiValidationResult[] = [];

  // Gemini는 필수, 모든 AI 기능 담당
  if (geminiResult.status === 'fulfilled') {
    results.push({
      ...geminiResult.value,
      details: {
        ...geminiResult.value.details,
        features: ['이미지분석', '스크립트생성', 'TTS음성합성'],
        architecture: 'Gemini 단일 엔진'
      }
    });
  } else {
    results.push({
      service: 'gemini',
      valid: false,
      error: geminiResult.reason?.message || 'Gemini API 검증 실패 - 모든 AI 기능 중단'
    });
  }

  // 제거된 서비스들 (정보성 표시)
  if (azureResult.status === 'fulfilled') {
    results.push(azureResult.value);
  }

  if (openaiResult.status === 'fulfilled') {
    results.push(openaiResult.value);
  }

  // 결과 출력
  results.forEach(result => {
    const status = result.valid ? '✅' : result.optional ? '🔄' : '❌';
    const optional = result.optional ? ' (제거됨)' : '';
    const message = result.valid ? 
      `연결 성공 ${result.details?.features ? `- ${result.details.features.join(', ')}` : ''}` : 
      result.error;
    console.log(`${status} ${result.service}${optional}: ${message}`);
  });

  const requiredApis = results.filter(r => !r.optional);
  const validRequired = requiredApis.filter(r => r.valid).length;
  console.log(`📊 Gemini 통합 아키텍처 검증: ${validRequired}/${requiredApis.length} 성공`);

  return results;
}

// 시스템 건강성 체크 (Gemini 통합 아키텍처)
export async function healthCheck(): Promise<{
  healthy: boolean;
  apis: ApiValidationResult[];
  environment: any;
  timestamp: string;
}> {
  const apis = await validateAllApiKeys();
  
  // 필수 API (Gemini만)으로 건강성 판단
  const requiredApis = apis.filter(api => !api.optional);
  const validRequired = requiredApis.filter(api => api.valid);
  const isHealthy = validRequired.length === requiredApis.length;
  
  return {
    healthy: isHealthy,
    apis,
    environment: {
      nodeEnv: env.NODE_ENV,
      maxImages: env.MAX_IMAGES_PER_PROJECT,
      maxDuration: env.MAX_VIDEO_DURATION,
      storageType: env.STORAGE_TYPE,
      primaryAI: 'gemini' // 주 AI 엔진 표시
    },
    timestamp: new Date().toISOString()
  };
}

// API 키 보안 등급 평가 (Gemini 중심)
export function evaluateApiKeySecurity(): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Gemini API 키 필수 확인
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    issues.push('Gemini API 키가 설정되지 않았거나 기본값 상태입니다 (필수)');
    recommendations.push('Google AI Studio에서 실제 API 키를 발급받아 설정하세요');
    score -= 50; // 필수 API이므로 높은 점수 차감
  }

  // ❌ 제거된 API 키들 (v1.4.0 Gemini 통합)
  // Azure Speech, OpenAI는 더 이상 사용하지 않음
  recommendations.push('v1.4.0: 모든 AI 기능이 Gemini로 통합되었습니다');
  recommendations.push('Azure Speech, OpenAI API 키는 더 이상 필요하지 않습니다');

  // 프로덕션 환경 체크
  if (env.NODE_ENV === 'production') {
    if (env.NEXTAUTH_SECRET.length < 32) {
      issues.push('프로덕션 환경의 NextAuth 시크릿이 너무 짧습니다');
      recommendations.push('32자 이상의 강력한 시크릿을 사용하세요');
      score -= 20;
    }

    if (!env.API_ENCRYPTION_KEY || env.API_ENCRYPTION_KEY.length !== 32) {
      issues.push('암호화 키가 올바르지 않습니다');
      recommendations.push('32자 암호화 키를 설정하세요');
      score -= 20;
    }
  }

  return { score: Math.max(0, score), issues, recommendations };
}

// 정기적 API 키 상태 모니터링 (Gemini 중심)
export class ApiKeyMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheck: Date | null = null;

  start(intervalMinutes: number = 60): void {
    this.intervalId = setInterval(async () => {
      try {
        const results = await validateAllApiKeys();
        
        // 필수 API (Gemini)만 실패 확인
        const requiredApis = results.filter(r => !(r as any).optional);
        const failedRequired = requiredApis.filter(r => !r.valid);
        
        // 옵션 API 실패는 경고 수준
        const optionalApis = results.filter(r => (r as any).optional);
        const failedOptional = optionalApis.filter(r => !r.valid);
        
        if (failedRequired.length > 0) {
          console.error('🚨 필수 API 키 오류:', failedRequired);
          // 여기에 긴급 알림 로직 추가 (이메일, 슬랙 등)
        }
        
        if (failedOptional.length > 0) {
          console.warn('⚠️  옵션 API 키 상태 경고:', failedOptional);
          // 여기에 일반 알림 로직 추가
        }
        
        this.lastCheck = new Date();
      } catch (error) {
        console.error('API 키 모니터링 오류:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 API 키 모니터링 시작 (${intervalMinutes}분 간격) - Gemini 중심`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️  API 키 모니터링 중지');
    }
  }

  getStatus() {
    return {
      running: this.intervalId !== null,
      lastCheck: this.lastCheck,
      primaryService: 'gemini' // 주요 모니터링 대상
    };
  }
}

export const apiKeyMonitor = new ApiKeyMonitor();