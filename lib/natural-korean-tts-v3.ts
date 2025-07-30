// 자연스러운 한국어 TTS v3 - 최신 ElevenLabs 기술 적용
// 2025년 최신 문서 기반 한국어 억양 최적화

export interface KoreanTTSConfig {
  model: 'eleven_multilingual_v2' | 'eleven_flash_v2.5' | 'eleven_v3_alpha';
  voice_id: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  enable_ssml?: boolean;
  previous_text?: string;  // 문맥 유지를 위한 이전 텍스트
  next_text?: string;      // 문맥 유지를 위한 다음 텍스트
}

// 최신 권장 설정 (2025년 기준)
export const KOREAN_VOICE_PRESETS = {
  // 자연스러운 대화형 (Multilingual v2 사용)
  natural_conversation: {
    model: 'eleven_multilingual_v2' as const,
    voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel
    settings: {
      stability: 0.45,        // 낮춰서 자연스러운 변화
      similarity_boost: 0.65,
      style: 0,              // v2에서는 0 권장
      use_speaker_boost: true
    },
    enable_ssml: true
  },

  // 감정 표현형 (Eleven v3 Alpha 사용)
  emotional_expression: {
    model: 'eleven_v3_alpha' as const,
    voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
    settings: {
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.8,            // v3에서는 감정 표현 가능
      use_speaker_boost: true
    },
    enable_ssml: false     // v3는 인라인 태그 사용
  },

  // 빠른 응답형 (Flash v2.5 사용)
  fast_response: {
    model: 'eleven_flash_v2.5' as const,
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam
    settings: {
      stability: 0.6,
      similarity_boost: 0.75,
      use_speaker_boost: true
    },
    enable_ssml: false
  }
};

// 한국어 텍스트 전처리 v3
export class KoreanTextPreprocessor {
  // 숫자 정규화 (Flash v2.5용)
  static normalizeNumbers(text: string): string {
    const numberMap: Record<string, string> = {
      '0': '영', '1': '일', '2': '이', '3': '삼', '4': '사',
      '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구'
    };

    // 년도 변환
    text = text.replace(/(\d{4})년/g, (match, year) => {
      const y = parseInt(year);
      if (y >= 2020 && y <= 2030) {
        const yearKorean = this.convertYearToKorean(y);
        return yearKorean + '년';
      }
      return match;
    });

    // 퍼센트 변환
    text = text.replace(/(\d+)%/g, (match, num) => {
      const n = parseInt(num);
      if (n <= 100) {
        return this.convertNumberToKorean(n) + '퍼센트';
      }
      return match;
    });

    return text;
  }

  // 년도를 한국어로 변환
  private static convertYearToKorean(year: number): string {
    const thousands = Math.floor(year / 1000);
    const hundreds = Math.floor((year % 1000) / 100);
    const tens = Math.floor((year % 100) / 10);
    const ones = year % 10;

    let result = '';
    if (thousands === 2) result += '이천';
    if (hundreds > 0) result += ['', '백', '이백', '삼백', '사백', '오백', '육백', '칠백', '팔백', '구백'][hundreds];
    if (tens > 0) result += ['', '십', '이십', '삼십', '사십', '오십', '육십', '칠십', '팔십', '구십'][tens];
    if (ones > 0) result += ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'][ones];

    return result;
  }

  // 숫자를 한국어로 변환
  private static convertNumberToKorean(num: number): string {
    if (num === 0) return '영';
    if (num === 10) return '십';
    if (num === 20) return '이십';
    if (num === 30) return '삼십';
    if (num === 50) return '오십';
    if (num === 70) return '칠십';
    if (num === 100) return '백';
    
    // 기타 경우는 숫자 그대로
    return num.toString();
  }

  // SSML 태그 추가 (Multilingual v2용)
  static addSSMLTags(text: string, pausePattern: 'natural' | 'dramatic' | 'fast'): string {
    let ssmlText = `<speak>`;
    
    // 문장 단위로 분리
    const sentences = text.split(/(?<=[.!?])\s*/);
    
    sentences.forEach((sentence, index) => {
      // 문장 추가
      ssmlText += sentence;
      
      // 문장 사이 쉼 추가
      if (index < sentences.length - 1) {
        switch (pausePattern) {
          case 'natural':
            ssmlText += `<break time="0.5s"/>`;
            break;
          case 'dramatic':
            ssmlText += `<break time="1s"/>`;
            break;
          case 'fast':
            ssmlText += `<break time="0.2s"/>`;
            break;
        }
      }
      
      // 쉼표 뒤 짧은 쉼
      sentence = sentence.replace(/,/g, ',<break time="0.2s"/>');
    });
    
    ssmlText += `</speak>`;
    return ssmlText;
  }

  // Eleven v3 인라인 태그 추가
  static addEmotionTags(text: string, emotion: string): string {
    // 감정 태그 매핑
    const emotionTags: Record<string, string> = {
      'excited': '[excited]',
      'cheerful': '[cheerfully]',
      'nervous': '[nervous]',
      'whisper': '[whispers]',
      'laugh': '[laughs]',
      'sigh': '[sighs]',
      'calm': '[calm]',
      'serious': '[serious]'
    };

    const tag = emotionTags[emotion] || '';
    
    // 문장 앞에 감정 태그 추가
    if (tag) {
      // 느낌표가 있는 문장은 excited 태그 자동 추가
      text = text.replace(/!/g, '! ' + emotionTags['excited'] + ' ');
      // 전체 텍스트 앞에도 태그 추가
      text = tag + ' ' + text;
    }

    return text;
  }

  // 발음 문제 해결 (대문자와 하이픈 사용)
  static fixPronunciation(text: string): string {
    // 문제가 되는 단어들을 발음대로 표기
    const pronunciationFixes: Record<string, string> = {
      'BMW': 'B-M-W',
      'AI': 'A-I',
      'VIP': 'V-I-P',
      'DIY': 'D-I-Y',
      'USB': 'U-S-B',
      'PC': 'P-C'
    };

    Object.entries(pronunciationFixes).forEach(([word, pronunciation]) => {
      text = text.replace(new RegExp(word, 'g'), pronunciation);
    });

    return text;
  }
}

// 자연스러운 한국어 생성 전략
export class NaturalKoreanTTS {
  private config: KoreanTTSConfig;

  constructor(config: KoreanTTSConfig) {
    this.config = config;
  }

  // 텍스트 준비 (모델별 최적화)
  prepareText(text: string, options?: {
    emotion?: string;
    pausePattern?: 'natural' | 'dramatic' | 'fast';
    fixPronunciation?: boolean;
  }): string {
    let processedText = text;

    // 1. 발음 수정 (모든 모델)
    if (options?.fixPronunciation !== false) {
      processedText = KoreanTextPreprocessor.fixPronunciation(processedText);
    }

    // 2. 모델별 처리
    switch (this.config.model) {
      case 'eleven_flash_v2.5':
        // Flash는 숫자 정규화 필요
        processedText = KoreanTextPreprocessor.normalizeNumbers(processedText);
        break;

      case 'eleven_multilingual_v2':
        // Multilingual v2는 SSML 사용
        if (this.config.enable_ssml && options?.pausePattern) {
          processedText = KoreanTextPreprocessor.addSSMLTags(
            processedText,
            options.pausePattern
          );
        }
        break;

      case 'eleven_v3_alpha':
        // v3는 인라인 감정 태그 사용
        if (options?.emotion) {
          processedText = KoreanTextPreprocessor.addEmotionTags(
            processedText,
            options.emotion
          );
        }
        break;
    }

    return processedText;
  }

  // API 요청 생성
  createAPIRequest(text: string): any {
    const request: any = {
      text: text,
      model_id: this.config.model,
      voice_settings: this.config.settings
    };

    // SSML 파싱 활성화
    if (this.config.enable_ssml) {
      request.enable_ssml_parsing = true;
    }

    // 문맥 추가 (자연스러운 흐름을 위해)
    if (this.config.previous_text) {
      request.previous_text = this.config.previous_text;
    }
    if (this.config.next_text) {
      request.next_text = this.config.next_text;
    }

    return request;
  }
}

// 사용 예시를 위한 헬퍼 함수
export function getBestKoreanVoiceForContent(contentType: string): KoreanTTSConfig {
  const contentMap: Record<string, keyof typeof KOREAN_VOICE_PRESETS> = {
    'narration': 'natural_conversation',
    'advertisement': 'emotional_expression',
    'realtime': 'fast_response',
    'tutorial': 'natural_conversation',
    'story': 'emotional_expression'
  };

  const presetKey = contentMap[contentType] || 'natural_conversation';
  return KOREAN_VOICE_PRESETS[presetKey];
}