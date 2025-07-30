// 활기찬 한국어 음성 생성 로직
// 밝고 에너지 넘치는 톤을 자동으로 생성하는 시스템

import { getElevenLabsTTS, ElevenLabsOptions } from './elevenlabs-tts';
import { KoreanTextPreprocessor } from './natural-korean-tts-v3';

// 감정 타입 정의
export type EnergeticEmotion = 'excited' | 'motivated' | 'enthusiastic' | 'cheerful' | 'celebratory';

// 활기찬 음성 설정
export interface EnergeticVoiceConfig {
  emotion: EnergeticEmotion;
  gender?: 'male' | 'female' | 'auto';
  intensity?: 'low' | 'medium' | 'high';
}

// 음성 모델 정보
interface VoiceModel {
  id: string;
  name: string;
  gender: 'male' | 'female';
  characteristics: string[];
}

// 활기찬 음성 모델 목록
const ENERGETIC_VOICE_MODELS: VoiceModel[] = [
  // 여성 음성
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    gender: 'female',
    characteristics: ['가장 활기찬', '에너지 넘치는', '광고 최적']
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    gender: 'female',
    characteristics: ['젊고 발랄한', '트렌디한', '신제품 소개']
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    characteristics: ['따뜻하고 밝은', '친근한', '축하 메시지']
  },
  // 남성 음성
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'male',
    characteristics: ['젊고 활기찬', '스포츠', '동기부여']
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'male',
    characteristics: ['친근한', '신뢰감', '안내']
  }
];

// 감정별 프로소디 설정
const EMOTION_PROSODY_MAP: Record<EnergeticEmotion, any> = {
  excited: {
    rate: '108%',
    pitch: '+8%',
    description: '신나고 기쁜 감정'
  },
  motivated: {
    rate: '110%',
    pitch: '+10%',
    volume: 'loud',
    description: '동기부여와 격려'
  },
  enthusiastic: {
    rate: '112%',
    pitch: '+12%',
    description: '열정적이고 흥분된'
  },
  cheerful: {
    rate: '105%',
    pitch: '+7%',
    description: '명랑하고 밝은'
  },
  celebratory: {
    rate: '110%',
    pitch: '+10%',
    description: '축하와 기쁨'
  }
};

// 활기찬 음성 생성기 클래스
export class EnergeticVoiceGenerator {
  private elevenLabs: ReturnType<typeof getElevenLabsTTS>;

  constructor() {
    this.elevenLabs = getElevenLabsTTS();
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs API가 초기화되지 않았습니다.');
    }
  }

  /**
   * 활기찬 음성 생성
   */
  async generateEnergeticVoice(
    text: string,
    config: EnergeticVoiceConfig = { emotion: 'excited' }
  ): Promise<{
    success: boolean;
    audioUrl?: string;
    audioBuffer?: Buffer;
    duration?: number;
    voiceUsed?: string;
    error?: string;
  }> {
    try {
      // 1. 음성 모델 선택
      const voiceModel = this.selectVoiceModel(config);
      
      // 2. 텍스트 전처리 및 SSML 생성
      const processedText = this.processEnergeticText(text, config);
      
      // 3. 음성 설정
      const voiceSettings = this.getEnergeticVoiceSettings(config.intensity);
      
      // 4. ElevenLabs API 호출
      const result = await this.elevenLabs?.textToSpeech(processedText, {
        voice_id: voiceModel.id,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings,
        enable_ssml_parsing: true
      } as any);

      if (result && result.success) {
        return {
          success: true,
          audioUrl: result.audioPath,
          audioBuffer: result.audioBuffer,
          duration: result.duration,
          voiceUsed: `${voiceModel.name} (${voiceModel.gender})`
        };
      } else {
        return {
          success: false,
          error: result?.error || 'TTS 생성 실패'
        };
      }

    } catch (error: any) {
      console.error('활기찬 음성 생성 오류:', error);
      return {
        success: false,
        error: error.message || '음성 생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 음성 모델 선택
   */
  private selectVoiceModel(config: EnergeticVoiceConfig): VoiceModel {
    let candidates = ENERGETIC_VOICE_MODELS;

    // 성별 필터링
    if (config.gender && config.gender !== 'auto') {
      candidates = candidates.filter(v => v.gender === config.gender);
    }

    // 감정별 최적 음성 선택
    if (config.emotion === 'enthusiastic' || config.emotion === 'excited') {
      // Elli 또는 Josh 우선
      const preferred = candidates.find(v => 
        v.name === 'Elli' || v.name === 'Josh'
      );
      if (preferred) return preferred;
    } else if (config.emotion === 'celebratory' || config.emotion === 'cheerful') {
      // Rachel 또는 Adam 우선
      const preferred = candidates.find(v => 
        v.name === 'Rachel' || v.name === 'Adam'
      );
      if (preferred) return preferred;
    }

    // 랜덤 선택 (성별 균형 고려)
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * 활기찬 텍스트 처리 (SSML 생성)
   */
  private processEnergeticText(text: string, config: EnergeticVoiceConfig): string {
    // 기본 전처리 (숫자, 영어 등)
    let processedText = KoreanTextPreprocessor.normalizeNumbers(text);
    processedText = KoreanTextPreprocessor.fixPronunciation(processedText);

    // 활기찬 표현 강조
    processedText = this.emphasizeEnergeticWords(processedText);

    // 리듬 생성
    processedText = this.addEnergeticRhythm(processedText);

    // 감정별 프로소디 적용
    const ssml = this.wrapWithEmotionProsody(processedText, config.emotion);

    return ssml;
  }

  /**
   * 활기찬 단어 강조
   */
  private emphasizeEnergeticWords(text: string): string {
    // 강조 단어 목록
    const emphasisWords = [
      '정말', '진짜', '너무', '완전', '대박', '최고', '굉장히',
      '놀라운', '멋진', '훌륭한', '대단한', '환상적'
    ];

    emphasisWords.forEach(word => {
      text = text.replace(
        new RegExp(word, 'g'),
        `<emphasis level="strong">${word}</emphasis>`
      );
    });

    // 특수 표현 처리
    text = text.replace(/와!/g, '<prosody pitch="+15%" rate="110%">와!</prosody>');
    text = text.replace(/대박!/g, '<prosody pitch="+15%" rate="115%">대박!</prosody>');
    text = text.replace(/파이팅/g, '<prosody pitch="+20%" rate="120%">파이팅</prosody>');
    text = text.replace(/축하/g, '<emphasis level="strong">축하</emphasis>');

    return text;
  }

  /**
   * 활기찬 리듬 추가
   */
  private addEnergeticRhythm(text: string): string {
    // 느낌표 뒤 짧은 쉼
    text = text.replace(/!/g, '!<break time="100ms"/>');
    
    // 의문문 억양
    text = text.replace(/\?/g, '<prosody pitch="+15%">?</prosody>');
    
    // 문장 사이 적절한 쉼
    text = text.replace(/\. /g, '.<break time="150ms"/> ');
    
    // 쉼표 뒤 미세한 쉼
    text = text.replace(/, /g, ',<break time="50ms"/> ');

    return text;
  }

  /**
   * 감정별 프로소디로 감싸기
   */
  private wrapWithEmotionProsody(text: string, emotion: EnergeticEmotion): string {
    const prosody = EMOTION_PROSODY_MAP[emotion];
    
    let ssml = '<speak>';
    ssml += `<prosody rate="${prosody.rate}" pitch="${prosody.pitch}"`;
    
    if (prosody.volume) {
      ssml += ` volume="${prosody.volume}"`;
    }
    
    ssml += `>${text}</prosody>`;
    ssml += '</speak>';

    return ssml;
  }

  /**
   * 음성 설정 가져오기
   */
  private getEnergeticVoiceSettings(intensity?: 'low' | 'medium' | 'high') {
    const baseSettings = {
      stability: 0.42,
      similarity_boost: 0.63,
      style: 0,
      use_speaker_boost: true
    };

    // 강도별 조정
    switch (intensity) {
      case 'low':
        baseSettings.stability = 0.48;
        baseSettings.similarity_boost = 0.68;
        break;
      case 'high':
        baseSettings.stability = 0.38;
        baseSettings.similarity_boost = 0.60;
        break;
      // medium은 기본값 사용
    }

    return baseSettings;
  }

  /**
   * 비디오 타입에 맞는 활기찬 음성 생성
   */
  async generateForVideoType(
    text: string,
    videoType: 'advertisement' | 'tutorial' | 'motivation' | 'celebration'
  ) {
    const configMap: Record<string, EnergeticVoiceConfig> = {
      advertisement: {
        emotion: 'enthusiastic',
        intensity: 'high'
      },
      tutorial: {
        emotion: 'cheerful',
        intensity: 'medium'
      },
      motivation: {
        emotion: 'motivated',
        intensity: 'high'
      },
      celebration: {
        emotion: 'celebratory',
        intensity: 'high'
      }
    };

    const config = configMap[videoType] || { emotion: 'excited' };
    return this.generateEnergeticVoice(text, config);
  }

  /**
   * 사용 가능한 활기찬 음성 목록
   */
  getAvailableVoices() {
    return ENERGETIC_VOICE_MODELS.map(model => ({
      id: model.id,
      name: model.name,
      gender: model.gender,
      characteristics: model.characteristics,
      suitable_for: this.getSuitableEmotions(model.name)
    }));
  }

  /**
   * 음성별 적합한 감정 추천
   */
  private getSuitableEmotions(voiceName: string): EnergeticEmotion[] {
    const suitabilityMap: Record<string, EnergeticEmotion[]> = {
      'Elli': ['enthusiastic', 'excited', 'motivated'],
      'Domi': ['cheerful', 'enthusiastic', 'excited'],
      'Rachel': ['celebratory', 'cheerful', 'excited'],
      'Josh': ['motivated', 'enthusiastic', 'excited'],
      'Adam': ['cheerful', 'celebratory', 'motivated']
    };

    return suitabilityMap[voiceName] || ['excited'];
  }
}

// 싱글톤 인스턴스 생성 헬퍼
let energeticVoiceInstance: EnergeticVoiceGenerator | null = null;

export function getEnergeticVoiceGenerator(): EnergeticVoiceGenerator | null {
  if (!getElevenLabsTTS()) {
    console.warn('ElevenLabs API가 구성되지 않았습니다.');
    return null;
  }

  if (!energeticVoiceInstance) {
    energeticVoiceInstance = new EnergeticVoiceGenerator();
  }

  return energeticVoiceInstance;
}

// 간편 사용을 위한 헬퍼 함수
export async function generateEnergeticVoice(
  text: string,
  emotion: EnergeticEmotion = 'excited',
  gender?: 'male' | 'female'
) {
  const generator = getEnergeticVoiceGenerator();
  if (!generator) {
    throw new Error('활기찬 음성 생성기를 초기화할 수 없습니다.');
  }

  return generator.generateEnergeticVoice(text, { emotion, gender });
}