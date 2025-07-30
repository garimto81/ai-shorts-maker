// Google Cloud Text-to-Speech API 실제 구현
// 실제 사람 목소리를 생성하기 위한 구현

import { env } from './env-config';

export interface GoogleTTSConfig {
  apiKey: string;
  voice: {
    languageCode: string;
    name?: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  audioConfig: {
    audioEncoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    sampleRateHertz?: number;
  };
}

export class GoogleCloudTTS {
  private apiKey: string;
  private apiEndpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 텍스트를 실제 음성으로 변환
   */
  async synthesizeSpeech(
    text: string,
    ssml: boolean = false,
    config?: Partial<GoogleTTSConfig>
  ): Promise<Buffer> {
    const requestBody = {
      input: ssml ? { ssml: text } : { text: text },
      voice: config?.voice || {
        languageCode: 'ko-KR',
        name: 'ko-KR-Neural2-C', // 한국어 여성 음성
        ssmlGender: 'FEMALE'
      },
      audioConfig: config?.audioConfig || {
        audioEncoding: 'LINEAR16',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
        sampleRateHertz: 24000
      }
    };

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google TTS API 오류: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      // audioContent는 base64로 인코딩된 오디오 데이터
      const audioBuffer = Buffer.from(result.audioContent, 'base64');
      
      return audioBuffer;
    } catch (error) {
      console.error('Google TTS API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * 사용 가능한 음성 목록 가져오기
   */
  async listVoices(languageCode?: string): Promise<any[]> {
    const url = new URL('https://texttospeech.googleapis.com/v1/voices');
    if (languageCode) {
      url.searchParams.append('languageCode', languageCode);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Goog-Api-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`음성 목록 조회 실패: ${response.status}`);
      }

      const result = await response.json();
      return result.voices || [];
    } catch (error) {
      console.error('음성 목록 조회 오류:', error);
      return [];
    }
  }
}

// 한국어 음성 옵션
export const KOREAN_VOICES = {
  // Neural2 음성 (고품질)
  'ko-KR-Neural2-A': { name: 'ko-KR-Neural2-A', gender: 'FEMALE', description: '한국어 여성 A (Neural2)' },
  'ko-KR-Neural2-B': { name: 'ko-KR-Neural2-B', gender: 'MALE', description: '한국어 남성 B (Neural2)' },
  'ko-KR-Neural2-C': { name: 'ko-KR-Neural2-C', gender: 'FEMALE', description: '한국어 여성 C (Neural2)' },
  
  // Wavenet 음성 (고품질)
  'ko-KR-Wavenet-A': { name: 'ko-KR-Wavenet-A', gender: 'FEMALE', description: '한국어 여성 A (Wavenet)' },
  'ko-KR-Wavenet-B': { name: 'ko-KR-Wavenet-B', gender: 'FEMALE', description: '한국어 여성 B (Wavenet)' },
  'ko-KR-Wavenet-C': { name: 'ko-KR-Wavenet-C', gender: 'MALE', description: '한국어 남성 C (Wavenet)' },
  'ko-KR-Wavenet-D': { name: 'ko-KR-Wavenet-D', gender: 'MALE', description: '한국어 남성 D (Wavenet)' },
  
  // Standard 음성 (기본)
  'ko-KR-Standard-A': { name: 'ko-KR-Standard-A', gender: 'FEMALE', description: '한국어 여성 A (Standard)' },
  'ko-KR-Standard-B': { name: 'ko-KR-Standard-B', gender: 'FEMALE', description: '한국어 여성 B (Standard)' },
  'ko-KR-Standard-C': { name: 'ko-KR-Standard-C', gender: 'MALE', description: '한국어 남성 C (Standard)' },
  'ko-KR-Standard-D': { name: 'ko-KR-Standard-D', gender: 'MALE', description: '한국어 남성 D (Standard)' }
};