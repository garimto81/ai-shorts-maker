// 영상 렌더링 관련 공통 유틸리티 함수들

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SystemCapabilities {
  ffmpegWasm: boolean;
  mediaRecorder: boolean;
  audioContext: boolean;
  sharedArrayBuffer: boolean;
  crossOriginIsolated: boolean;
}

// 파일 유효성 검사
export function validateFiles(images: File[], audioFile?: File | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 이미지 파일 검사
  if (!images || images.length === 0) {
    errors.push('최소 1개 이상의 이미지 파일이 필요합니다');
  } else {
    // 이미지 파일 형식 검사
    const invalidImages = images.filter(file => !file.type.startsWith('image/'));
    if (invalidImages.length > 0) {
      errors.push(`올바르지 않은 이미지 파일: ${invalidImages.map(f => f.name).join(', ')}`);
    }

    // 이미지 파일 크기 검사
    const oversizedImages = images.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedImages.length > 0) {
      warnings.push(`큰 이미지 파일 (10MB 초과): ${oversizedImages.map(f => f.name).join(', ')}`);
    }

    // 총 이미지 수 검사
    if (images.length > 100) {
      warnings.push('이미지가 100개를 초과합니다. 처리 시간이 오래 걸릴 수 있습니다');
    }
  }

  // 음성 파일 검사
  if (audioFile) {
    if (!audioFile.type.startsWith('audio/')) {
      errors.push(`올바르지 않은 음성 파일: ${audioFile.name}`);
    }

    if (audioFile.size > 50 * 1024 * 1024) { // 50MB
      warnings.push(`큰 음성 파일 (50MB 초과): ${audioFile.name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 시스템 지원 기능 확인
export function checkSystemCapabilities(): SystemCapabilities {
  const capabilities: SystemCapabilities = {
    ffmpegWasm: false,
    mediaRecorder: false,
    audioContext: false,
    sharedArrayBuffer: false,
    crossOriginIsolated: false
  };

  try {
    // FFmpeg WebAssembly 지원 확인
    capabilities.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    capabilities.crossOriginIsolated = 'crossOriginIsolated' in window && window.crossOriginIsolated;
    capabilities.ffmpegWasm = capabilities.sharedArrayBuffer && capabilities.crossOriginIsolated;

    // MediaRecorder 지원 확인
    capabilities.mediaRecorder = !!(
      typeof MediaRecorder !== 'undefined' &&
      HTMLCanvasElement.prototype.captureStream
    );

    // AudioContext 지원 확인
    capabilities.audioContext = !!(
      typeof AudioContext !== 'undefined' || 
      typeof (window as any).webkitAudioContext !== 'undefined'
    );

  } catch (error) {
    console.warn('시스템 기능 확인 중 오류:', error);
  }

  return capabilities;
}

// 렌더링 모드별 추천 설정
export function getRecommendedSettings(mode: 'browser' | 'ffmpeg' | 'server', imageCount: number) {
  const baseSettings = {
    browser: {
      maxImages: 50,
      maxDuration: 60, // 초
      recommendedResolution: { width: 720, height: 1280 },
      supportedFormats: ['webm'],
      quality: 'medium' as const,
      frameRate: 24
    },
    ffmpeg: {
      maxImages: 200,
      maxDuration: 300, // 5분
      recommendedResolution: { width: 1080, height: 1920 },
      supportedFormats: ['mp4', 'webm', 'avi'],
      quality: 'high' as const,
      frameRate: 30
    },
    server: {
      maxImages: 1000,
      maxDuration: 1800, // 30분
      recommendedResolution: { width: 1080, height: 1920 },
      supportedFormats: ['mp4', 'webm', 'avi'],
      quality: 'high' as const,
      frameRate: 30
    }
  };

  const settings = baseSettings[mode];
  
  // 이미지 수에 따른 조정
  if (imageCount > settings.maxImages) {
    settings.quality = 'medium';
    settings.frameRate = 24;
  }

  if (imageCount > 100) {
    settings.recommendedResolution = { width: 720, height: 1280 };
  }

  return settings;
}

// 예상 처리 시간 계산
export function estimateProcessingTime(
  mode: 'browser' | 'ffmpeg' | 'server',
  imageCount: number,
  imageDuration: number,
  hasAudio: boolean
): number {
  // 기본 처리 시간 (초 단위)
  const baseTimePerImage = {
    browser: 0.5,
    ffmpeg: 1.0,
    server: 0.3
  };

  let estimatedTime = imageCount * baseTimePerImage[mode];
  
  // 영상 길이에 따른 추가 시간
  const totalVideoDuration = imageCount * imageDuration;
  estimatedTime += totalVideoDuration * 0.1;

  // 음성 처리 추가 시간
  if (hasAudio) {
    estimatedTime += Math.min(totalVideoDuration * 0.2, 30); // 최대 30초 추가
  }

  // 모드별 오버헤드
  const overhead = {
    browser: 5, // 브라우저 API 준비
    ffmpeg: 15, // FFmpeg 로딩
    server: 3   // 네트워크 지연
  };

  estimatedTime += overhead[mode];

  return Math.round(estimatedTime);
}

// 파일 크기 추정
export function estimateFileSize(
  imageCount: number,
  imageDuration: number,
  resolution: { width: number; height: number },
  quality: 'high' | 'medium' | 'low',
  hasAudio: boolean
): number {
  const totalDuration = imageCount * imageDuration;
  const pixelCount = resolution.width * resolution.height;
  
  // 품질별 비트레이트 (kbps)
  const videoBitrates = {
    high: Math.min(pixelCount / 150, 8000),
    medium: Math.min(pixelCount / 300, 4000),
    low: Math.min(pixelCount / 600, 2000)
  };

  const audioBitrate = hasAudio ? 128 : 0; // kbps
  const totalBitrate = videoBitrates[quality] + audioBitrate;
  
  // 파일 크기 계산 (바이트)
  const fileSizeBytes = (totalBitrate * 1000 * totalDuration) / 8;
  
  return Math.round(fileSizeBytes);
}

// 에러 메시지 한국어화
export function translateErrorMessage(error: string): string {
  const errorMap: { [key: string]: string } = {
    'Failed to load FFmpeg': 'FFmpeg 로딩에 실패했습니다',
    'SharedArrayBuffer is not supported': 'SharedArrayBuffer가 지원되지 않습니다',
    'MediaRecorder is not supported': 'MediaRecorder가 지원되지 않습니다',
    'Audio decoding failed': '음성 파일 디코딩에 실패했습니다',
    'Canvas capture not supported': 'Canvas 캡처가 지원되지 않습니다',
    'File size too large': '파일 크기가 너무 큽니다',
    'Invalid file format': '지원하지 않는 파일 형식입니다',
    'Network error': '네트워크 오류가 발생했습니다',
    'Server error': '서버 오류가 발생했습니다',
    'Out of memory': '메모리가 부족합니다',
    'Processing timeout': '처리 시간이 초과되었습니다'
  };

  // 부분 매칭으로 에러 메시지 찾기
  for (const [englishError, koreanError] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(englishError.toLowerCase())) {
      return koreanError;
    }
  }

  return error; // 매칭되지 않으면 원본 반환
}

// 진행률 계산 헬퍼
export class ProgressCalculator {
  private phases: { [key: string]: { weight: number; range: [number, number] } };
  private currentPhase: string = '';

  constructor(phases: { [key: string]: number }) {
    const totalWeight = Object.values(phases).reduce((sum, weight) => sum + weight, 0);
    let currentStart = 0;

    this.phases = {};
    for (const [phase, weight] of Object.entries(phases)) {
      const normalizedWeight = weight / totalWeight;
      const range: [number, number] = [currentStart, currentStart + normalizedWeight * 100];
      this.phases[phase] = { weight: normalizedWeight, range };
      currentStart = range[1];
    }
  }

  setPhase(phase: string) {
    this.currentPhase = phase;
  }

  getProgress(phaseProgress: number): number {
    if (!this.phases[this.currentPhase]) {
      return 0;
    }

    const { range } = this.phases[this.currentPhase];
    const phaseRange = range[1] - range[0];
    const adjustedProgress = range[0] + (phaseProgress / 100) * phaseRange;

    return Math.min(100, Math.max(0, adjustedProgress));
  }

  getAllPhases(): string[] {
    return Object.keys(this.phases);
  }
}

// 디버그 정보 수집
export function collectDebugInfo(): any {
  const capabilities = checkSystemCapabilities();
  
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    capabilities,
    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio
    },
    memory: 'memory' in performance ? (performance as any).memory : null,
    connection: 'connection' in navigator ? (navigator as any).connection : null,
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
  };
}