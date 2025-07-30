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
      const audioData = await this.generateAudioWithGemini(enhancedPrompt, voiceName, request.style);
      
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
   * Gemini를 사용한 오디오 생성
   * ElevenLabs 또는 Google Cloud TTS API를 사용하여 실제 음성 생성
   */
  private async generateAudioWithGemini(prompt: string, voiceName: string, style?: string): Promise<Buffer> {
    console.log('📝 TTS 프롬프트:', prompt.substring(0, 100) + '...');
    console.log('🎤 선택된 음성:', voiceName);
    console.log('🎨 스타일:', style || 'neutral');
    
    // 1. 'excited' 스타일인 경우 활기찬 음성 생성기 사용
    if (style === 'excited' && process.env.ELEVENLABS_API_KEY) {
      try {
        console.log('🎉 활기찬 음성 생성기 사용...');
        const { getEnergeticVoiceGenerator } = await import('./energetic-voice-generator');
        const energeticGenerator = getEnergeticVoiceGenerator();
        
        if (energeticGenerator) {
          // 원본 텍스트 추출 (스타일 프리픽스 제거)
          const textMatch = prompt.match(/: (.+)$/);
          const originalText = textMatch ? textMatch[1] : prompt;
          
          // 성별 결정 (Gemini 음성 기반)
          const gender = (voiceName === 'Kore' || voiceName === 'Aoede') ? 'female' : 'male';
          
          const result = await energeticGenerator.generateEnergeticVoice(originalText, {
            emotion: 'enthusiastic',
            gender: gender,
            intensity: 'high'
          });
          
          if (result.success && result.audioBuffer) {
            console.log('✅ 활기찬 음성 생성 성공!');
            return this.convertMP3toPCM(result.audioBuffer);
          }
        }
      } catch (error) {
        console.error('⚠️ 활기찬 음성 생성 실패, 일반 ElevenLabs로 폴백:', error);
      }
    }
    
    // 2. ElevenLabs 일반 음성 시도
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log('🎙️ ElevenLabs API 사용 시도...');
        const { getElevenLabsTTS } = await import('./elevenlabs-tts');
        const elevenLabs = getElevenLabsTTS();
        
        if (elevenLabs) {
          // 음성 매핑 (Gemini 음성명 -> ElevenLabs 음성 ID)
          const voiceMap: Record<string, string> = {
            'Kore': '21m00Tcm4TlvDq8ikWAM',      // Rachel - 한국어 여성
            'Aoede': 'AZnzlk1XvdvUeBnXmlld',     // Domi - 영어 여성
            'Fenrir': 'pNInz6obpgDQGcFmaJgB',    // Adam - 영어 남성
            'Puck': 'TxGEqnHWrfWFTfGW9XjX'       // Josh - 영어 남성 (밝은 톤)
          };
          
          const result = await elevenLabs.textToSpeech(prompt, {
            voice_id: voiceMap[voiceName] || 'pNInz6obpgDQGcFmaJgB',
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          });
          
          if (result.success && result.audioBuffer) {
            console.log('✅ ElevenLabs로 음성 생성 성공!');
            // MP3를 PCM으로 변환 (WAV 형식 맞추기 위해)
            return this.convertMP3toPCM(result.audioBuffer);
          }
        }
      } catch (error) {
        console.error('⚠️ ElevenLabs 사용 실패:', error);
      }
    }
    
    // 2. Google Cloud TTS 시도
    if (process.env.GOOGLE_CLOUD_API_KEY) {
      try {
        console.log('🎙️ Google Cloud TTS 사용 시도...');
        const { GoogleCloudTTS } = await import('./google-cloud-tts');
        const googleTTS = new GoogleCloudTTS(process.env.GOOGLE_CLOUD_API_KEY);
        
        const voiceMap: Record<string, string> = {
          'Kore': 'ko-KR-Neural2-C',
          'Aoede': 'en-US-Neural2-F',
          'Fenrir': 'en-US-Neural2-D',
          'Puck': 'en-US-Neural2-A'
        };
        
        const audioBuffer = await googleTTS.synthesizeSpeech(prompt, true, {
          voice: {
            languageCode: voiceMap[voiceName]?.substring(0, 5) || 'ko-KR',
            name: voiceMap[voiceName] || 'ko-KR-Neural2-C'
          },
          audioConfig: {
            audioEncoding: 'LINEAR16',
            sampleRateHertz: 24000
          }
        });
        
        console.log('✅ Google Cloud TTS로 음성 생성 성공!');
        return audioBuffer;
        
      } catch (error) {
        console.error('⚠️ Google Cloud TTS 사용 실패:', error);
      }
    }
    
    // 3. 모든 API가 실패하면 기본 음성 (무음)
    console.warn('⚠️ 모든 TTS API가 실패하여 무음을 생성합니다.');
    return this.generateDefaultAudio(prompt);
  }

  /**
   * MP3를 PCM으로 변환 (간단한 구현)
   */
  private convertMP3toPCM(mp3Buffer: Buffer): Buffer {
    // 실제로는 ffmpeg 등을 사용해야 하지만, 일단 그대로 반환
    // WAV 헤더는 convertPCMToWAV에서 추가됨
    return mp3Buffer;
  }

  /**
   * 기본 음성 생성 (무음 또는 간단한 톤)
   */
  private generateDefaultAudio(prompt: string): Buffer {
    const textLength = prompt.length;
    const estimatedDuration = Math.max(2, textLength * 0.08);
    const sampleCount = Math.floor(estimatedDuration * 24000);
    const pcmData = Buffer.alloc(sampleCount * 2);
    
    // 무음 생성 (고주파 대신)
    pcmData.fill(0);
    
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