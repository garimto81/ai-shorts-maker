// Gemini AI TTS (Text-to-Speech) 엔진 (v1.5.0)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';
import fs from 'fs';
import path from 'path';

export interface TTSRequest {
  text: string;
  voice?: string; // 음성 이름
  speed?: 'slow' | 'normal' | 'fast';
  style?: 'neutral' | 'cheerful' | 'calm' | 'excited' | 'professional';
  language?: 'ko' | 'en' | 'ja' | 'zh';
}

export interface TTSResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioPath?: string;
  duration?: number; // 초 단위
  format: 'wav' | 'pcm';
  sampleRate: number;
  channels: number;
  error?: string;
}

export interface VoiceConfig {
  name: string;
  language: string;
  gender: 'male' | 'female';
  description: string;
  available: boolean;
}

export class GeminiTTSEngine {
  private genAI: GoogleGenerativeAI;
  private outputDir: string;

  // 사용 가능한 음성 목록 (Gemini 2.5 기준)
  private readonly availableVoices: Record<string, VoiceConfig> = {
    'Kore': {
      name: 'Kore',
      language: 'ko',
      gender: 'female',
      description: '한국어 여성 음성 (기본)',
      available: true
    },
    'Aoede': {
      name: 'Aoede',
      language: 'en',
      gender: 'female', 
      description: '영어 여성 음성',
      available: true
    },
    'Fenrir': {
      name: 'Fenrir',
      language: 'en',
      gender: 'male',
      description: '영어 남성 음성',
      available: true
    },
    'Puck': {
      name: 'Puck',
      language: 'en',
      gender: 'male',
      description: '영어 남성 음성 (밝은 톤)',
      available: true
    }
  };

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.outputDir = path.join(process.cwd(), 'public', 'audio');
    
    // 오디오 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 텍스트를 음성으로 변환
   */
  async textToSpeech(request: TTSRequest): Promise<TTSResult> {
    console.log('🎙️ Gemini TTS 변환 시작:', {
      textLength: request.text.length,
      voice: request.voice || 'Kore',
      speed: request.speed || 'normal',
      style: request.style || 'neutral'
    });

    try {
      // 1. 음성 선택 및 검증
      const voiceName = this.selectVoice(request.voice, request.language);
      
      // 2. 스타일 및 속도에 따른 프롬프트 생성
      const enhancedPrompt = this.createStyledPrompt(request.text, request);
      
      // 3. Gemini 2.5 TTS 모델 호출
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash" // TTS 지원 모델로 변경 예정
      });

      console.log('🤖 Gemini TTS API 호출 중...');
      
      // 실제 구현에서는 Gemini 2.5 TTS API 사용
      // 현재는 시뮬레이션 버전으로 구현
      const audioData = await this.generateAudioWithGemini(enhancedPrompt, voiceName);
      
      // 4. 오디오 파일 저장
      const filename = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
      const audioPath = path.join(this.outputDir, filename);
      
      // PCM 데이터를 WAV로 변환하여 저장
      const wavBuffer = this.convertPCMToWAV(audioData);
      fs.writeFileSync(audioPath, wavBuffer);
      
      // 5. 오디오 지속 시간 계산
      const duration = this.calculateAudioDuration(audioData, 24000); // 24kHz 샘플레이트
      
      console.log('✅ TTS 변환 완료:', {
        audioPath: `/audio/${filename}`,
        duration: Math.round(duration * 100) / 100 + '초',
        fileSize: Math.round(wavBuffer.length / 1024) + 'KB'
      });

      return {
        success: true,
        audioBuffer: wavBuffer,
        audioPath: `/audio/${filename}`,
        duration,
        format: 'wav',
        sampleRate: 24000,
        channels: 1
      };

    } catch (error: any) {
      console.error('❌ Gemini TTS 변환 실패:', error);
      
      return {
        success: false,
        error: error.message || 'TTS 변환 중 오류가 발생했습니다.',
        format: 'wav',
        sampleRate: 24000,
        channels: 1
      };
    }
  }

  /**
   * 사용 가능한 음성 목록 반환
   */
  getAvailableVoices(): VoiceConfig[] {
    return Object.values(this.availableVoices).filter(voice => voice.available);
  }

  /**
   * 언어에 맞는 기본 음성 선택
   */
  private selectVoice(requestedVoice?: string, language?: string): string {
    // 요청된 음성이 있고 사용 가능하면 사용
    if (requestedVoice && this.availableVoices[requestedVoice]?.available) {
      return requestedVoice;
    }

    // 언어에 맞는 기본 음성 선택
    const languageDefaults = {
      'ko': 'Kore',      // 한국어 -> Kore
      'en': 'Aoede',     // 영어 -> Aoede
      'ja': 'Kore',      // 일본어 -> Kore (한국어 음성 사용)
      'zh': 'Kore'       // 중국어 -> Kore (한국어 음성 사용)
    };

    return languageDefaults[language as keyof typeof languageDefaults] || 'Kore';
  }

  /**
   * 스타일과 속도에 따른 프롬프트 생성
   */
  private createStyledPrompt(text: string, request: TTSRequest): string {
    let stylePrefix = '';
    
    // 스타일 적용
    switch (request.style) {
      case 'cheerful':
        stylePrefix = '밝고 경쾌한 목소리로 말해주세요: ';
        break;
      case 'calm':
        stylePrefix = '차분하고 안정적인 목소리로 말해주세요: ';
        break;
      case 'excited':
        stylePrefix = '활기차고 열정적인 목소리로 말해주세요: ';
        break;
      case 'professional':
        stylePrefix = '전문적이고 신뢰감 있는 목소리로 말해주세요: ';
        break;
      default:
        stylePrefix = '자연스러운 목소리로 말해주세요: ';
    }

    // 속도 적용
    let speedInstruction = '';
    switch (request.speed) {
      case 'slow':
        speedInstruction = ' 천천히 또박또박 ';
        break;
      case 'fast':
        speedInstruction = ' 빠르고 생동감 있게 ';
        break;
      default:
        speedInstruction = ' 적당한 속도로 ';
    }

    return stylePrefix + speedInstruction + text;
  }

  /**
   * Gemini를 사용한 오디오 생성 (시뮬레이션)
   * 실제 구현에서는 Gemini 2.5 TTS API를 사용
   */
  private async generateAudioWithGemini(prompt: string, voiceName: string): Promise<Buffer> {
    // TODO: 실제 Gemini 2.5 TTS API 구현
    // 현재는 시뮬레이션을 위해 더미 PCM 데이터 생성
    
    console.log('📝 TTS 프롬프트:', prompt.substring(0, 100) + '...');
    console.log('🎤 선택된 음성:', voiceName);
    
    // 더미 PCM 오디오 데이터 생성 (실제로는 Gemini API 응답)
    const textLength = prompt.length;
    const estimatedDuration = Math.max(2, textLength * 0.08); // 글자당 약 80ms
    const sampleCount = Math.floor(estimatedDuration * 24000); // 24kHz
    const pcmData = Buffer.alloc(sampleCount * 2); // 16-bit
    
    // 더미 오디오 신호 생성 (실제로는 Gemini가 생성)
    for (let i = 0; i < sampleCount; i++) {
      const time = i / 24000;
      const frequency = 440 + Math.sin(time * 2) * 50; // 변화하는 주파수
      const amplitude = Math.sin(time * Math.PI * 2 * frequency) * 0.3;
      const sample = Math.round(amplitude * 32767);
      pcmData.writeInt16LE(sample, i * 2);
    }
    
    return pcmData;
  }

  /**
   * PCM 데이터를 WAV 파일로 변환
   */
  private convertPCMToWAV(pcmData: Buffer): Buffer {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;

    const wav = Buffer.alloc(44 + dataSize);
    let offset = 0;

    // WAV 헤더 작성
    wav.write('RIFF', offset); offset += 4;
    wav.writeUInt32LE(fileSize, offset); offset += 4;
    wav.write('WAVE', offset); offset += 4;
    wav.write('fmt ', offset); offset += 4;
    wav.writeUInt32LE(16, offset); offset += 4; // PCM 포맷 크기
    wav.writeUInt16LE(1, offset); offset += 2;  // PCM 포맷
    wav.writeUInt16LE(numChannels, offset); offset += 2;
    wav.writeUInt32LE(sampleRate, offset); offset += 4;
    wav.writeUInt32LE(byteRate, offset); offset += 4;
    wav.writeUInt16LE(blockAlign, offset); offset += 2;
    wav.writeUInt16LE(bitsPerSample, offset); offset += 2;
    wav.write('data', offset); offset += 4;
    wav.writeUInt32LE(dataSize, offset); offset += 4;
    
    // PCM 데이터 복사
    pcmData.copy(wav, offset);
    
    return wav;
  }

  /**
   * 오디오 지속 시간 계산
   */
  private calculateAudioDuration(pcmData: Buffer, sampleRate: number): number {
    const sampleCount = pcmData.length / 2; // 16-bit samples
    return sampleCount / sampleRate;
  }

  /**
   * TTS 엔진 상태 확인
   */
  async healthCheck(): Promise<{ status: string; engine: string; voices: number }> {
    try {
      const voices = this.getAvailableVoices();
      return {
        status: 'healthy',
        engine: 'Gemini 2.5 TTS',
        voices: voices.length
      };
    } catch (error) {
      return {
        status: 'error',
        engine: 'Gemini 2.5 TTS',
        voices: 0
      };
    }
  }
}

// 싱글톤 인스턴스 생성
export const geminiTTS = new GeminiTTSEngine();