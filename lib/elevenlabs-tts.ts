// ElevenLabs TTS API 통합
// 가장 자연스러운 음성 생성을 위한 구현

import fs from 'fs';
import path from 'path';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category?: string;
  labels?: Record<string, string>;
  settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export interface ElevenLabsOptions {
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;        // 0-1, 음성 안정성 (높을수록 일관성 있음)
    similarity_boost?: number; // 0-1, 원본 음성과의 유사성
    style?: number;           // 0-1, 스타일 강도
    use_speaker_boost?: boolean; // 음성 향상
  };
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id: string;
  }>;
}

export class ElevenLabsTTS {
  private apiKey: string;
  private apiUrl = 'https://api.elevenlabs.io/v1';
  private outputDir: string;
  
  // 기본 음성 설정 (한국어 지원 음성)
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - 다국어 지원
  private koreanVoices = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: '차분한 남성' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: '친근한 여성' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: '젊은 여성' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: '부드러운 여성' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: '활기찬 여성' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: '젊은 남성' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: '중년 남성' },
    { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', description: '나레이터' }
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.outputDir = path.join(process.cwd(), 'public', 'audio');
    
    // 오디오 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 텍스트를 음성으로 변환
   */
  async textToSpeech(
    text: string,
    options?: ElevenLabsOptions
  ): Promise<{
    success: boolean;
    audioBuffer?: Buffer;
    audioPath?: string;
    duration?: number;
    error?: string;
  }> {
    try {
      console.log('🎙️ ElevenLabs TTS 변환 시작');
      
      const voiceId = options?.voice_id || this.defaultVoiceId;
      const modelId = options?.model_id || 'eleven_multilingual_v2'; // 다국어 모델
      
      // API 요청
      const response = await fetch(
        `${this.apiUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: options?.voice_settings || {
              stability: 0.75,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            },
            pronunciation_dictionary_locators: options?.pronunciation_dictionary_locators
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      // 오디오 데이터 받기
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      // 파일로 저장
      const filename = `elevenlabs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const audioPath = path.join(this.outputDir, filename);
      fs.writeFileSync(audioPath, audioBuffer);
      
      // 예상 재생 시간 계산 (대략적)
      const duration = Math.ceil(text.length * 0.06); // 글자당 약 60ms
      
      console.log('✅ ElevenLabs TTS 변환 완료:', {
        audioPath: `/audio/${filename}`,
        size: Math.round(audioBuffer.length / 1024) + 'KB',
        duration: duration + '초 (예상)'
      });

      return {
        success: true,
        audioBuffer,
        audioPath: `/audio/${filename}`,
        duration
      };

    } catch (error: any) {
      console.error('❌ ElevenLabs TTS 변환 실패:', error);
      return {
        success: false,
        error: error.message || 'TTS 변환 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용 가능한 음성 목록 가져오기
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.apiUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`음성 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('음성 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 한국어 지원 음성 목록
   */
  getKoreanVoices() {
    return this.koreanVoices;
  }

  /**
   * 음성 미리듣기 URL 생성
   */
  getVoicePreviewUrl(voiceId: string): string {
    return `${this.apiUrl}/voices/${voiceId}/preview`;
  }

  /**
   * 사용량 확인
   */
  async getUsage(): Promise<{
    character_count: number;
    character_limit: number;
    remaining_characters: number;
  } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`사용량 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      const usage = data.subscription;
      
      return {
        character_count: usage.character_count,
        character_limit: usage.character_limit,
        remaining_characters: usage.character_limit - usage.character_count
      };
    } catch (error) {
      console.error('사용량 조회 오류:', error);
      return null;
    }
  }

  /**
   * 영상 타입에 맞는 음성 설정 추천
   */
  getRecommendedSettings(videoType: string): ElevenLabsOptions {
    const settingsMap: Record<string, ElevenLabsOptions> = {
      // 자동차 정비 - 전문적이고 신뢰감 있는
      auto_repair: {
        voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam
        voice_settings: {
          stability: 0.85,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      // 튜토리얼 - 친근하고 명확한
      tutorial: {
        voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      // 광고 - 활기차고 열정적인
      advertisement: {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.7,
          style: 0.8,
          use_speaker_boost: true
        }
      },
      // 나레이션 - 차분하고 안정적인
      narration: {
        voice_id: 'pqHfZKP75CvOlQylNhV4', // Bill
        voice_settings: {
          stability: 0.9,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true
        }
      },
      // 교육 - 명확하고 이해하기 쉬운
      educational: {
        voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true
        }
      }
    };

    return settingsMap[videoType] || settingsMap.narration;
  }

  /**
   * 스트리밍 음성 생성 (실시간)
   */
  async textToSpeechStream(
    text: string,
    options?: ElevenLabsOptions
  ): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const voiceId = options?.voice_id || this.defaultVoiceId;
      const modelId = options?.model_id || 'eleven_multilingual_v2';
      
      const response = await fetch(
        `${this.apiUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: options?.voice_settings || {
              stability: 0.75,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs Stream API error: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      console.error('스트리밍 TTS 오류:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 (API 키가 있을 때만 생성)
let elevenLabsInstance: ElevenLabsTTS | null = null;

export function getElevenLabsTTS(): ElevenLabsTTS | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ ElevenLabs API 키가 설정되지 않았습니다.');
    return null;
  }
  
  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsTTS(apiKey);
  }
  
  return elevenLabsInstance;
}