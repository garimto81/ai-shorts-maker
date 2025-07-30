# 🎙️ AI Shorts Maker - 자연스러운 음성 제작 가이드

## 📋 현재 시스템 분석

### 현재 구현 상태
- **엔진**: Gemini 2.5 TTS (시뮬레이션 버전)
- **음성**: Kore (한국어 여성), Aoede/Fenrir/Puck (영어)
- **설정**: 속도 3단계, 스타일 5종류
- **형식**: WAV 24kHz, 16-bit, 모노

### 문제점
1. 실제 Gemini TTS API가 아닌 시뮬레이션 코드
2. 음성 다양성 부족 (한국어 음성 1개)
3. 세밀한 조정 옵션 부재

## 🚀 자연스러운 음성을 위한 개선 방안

### 1. 텍스트 전처리 강화

#### A. 문장 부호 최적화
```typescript
// lib/tts-text-preprocessor.ts
export class TTSTextPreprocessor {
  // 숫자를 한국어로 변환
  convertNumbersToKorean(text: string): string {
    const numberMap: Record<string, string> = {
      '1': '일', '2': '이', '3': '삼', '4': '사', '5': '오',
      '6': '육', '7': '칠', '8': '팔', '9': '구', '0': '영'
    };
    
    // 연도 처리 (예: 2025년 → 이천이십오년)
    text = text.replace(/(\d{4})년/g, (match, year) => {
      return this.convertYearToKorean(year) + '년';
    });
    
    // 일반 숫자 처리
    text = text.replace(/(\d+)/g, (match, num) => {
      return this.convertNumberToKorean(num);
    });
    
    return text;
  }

  // 영어 단어 한글 표기
  convertEnglishToKorean(text: string): string {
    const englishMap: Record<string, string> = {
      'AI': '에이아이',
      'BMW': '비엠더블유',
      'CNC': '씨엔씨',
      'TTS': '티티에스',
      'UI': '유아이',
      'UX': '유엑스'
    };
    
    Object.entries(englishMap).forEach(([eng, kor]) => {
      text = text.replace(new RegExp(eng, 'gi'), kor);
    });
    
    return text;
  }

  // 문장 분리와 일시정지 삽입
  addNaturalPauses(text: string): string {
    // 마침표 뒤에 긴 일시정지
    text = text.replace(/\. /g, '. <pause duration="0.8s"/> ');
    
    // 쉼표 뒤에 짧은 일시정지
    text = text.replace(/, /g, ', <pause duration="0.3s"/> ');
    
    // 문단 사이에 더 긴 일시정지
    text = text.replace(/\n\n/g, '\n<pause duration="1.5s"/>\n');
    
    return text;
  }

  // 감정 표현 강화
  addEmotionalEmphasis(text: string, emotion: string): string {
    const emotionMarkers = {
      'excited': {
        start: '<prosody rate="110%" pitch="+10%">',
        end: '</prosody>'
      },
      'calm': {
        start: '<prosody rate="90%" pitch="-5%">',
        end: '</prosody>'
      },
      'professional': {
        start: '<prosody rate="95%" pitch="0%">',
        end: '</prosody>'
      }
    };
    
    if (emotionMarkers[emotion]) {
      // 중요한 부분에 강조 추가
      text = text.replace(/!([^!]+)!/g, 
        `${emotionMarkers[emotion].start}$1${emotionMarkers[emotion].end}`
      );
    }
    
    return text;
  }
}
```

### 2. SSML (Speech Synthesis Markup Language) 활용

#### B. SSML 태그로 세밀한 제어
```typescript
// lib/ssml-builder.ts
export class SSMLBuilder {
  private ssml: string = '';

  constructor() {
    this.ssml = '<speak>';
  }

  // 문장 추가
  addSentence(text: string, options?: {
    speed?: number;  // 50-200%
    pitch?: number;  // -50 to +50%
    volume?: number; // -50 to +50dB
  }): this {
    let sentence = text;
    
    if (options) {
      const prosodyAttrs = [];
      if (options.speed) prosodyAttrs.push(`rate="${options.speed}%"`);
      if (options.pitch) prosodyAttrs.push(`pitch="${options.pitch > 0 ? '+' : ''}${options.pitch}%"`);
      if (options.volume) prosodyAttrs.push(`volume="${options.volume > 0 ? '+' : ''}${options.volume}dB"`);
      
      if (prosodyAttrs.length > 0) {
        sentence = `<prosody ${prosodyAttrs.join(' ')}>${sentence}</prosody>`;
      }
    }
    
    this.ssml += `<s>${sentence}</s>`;
    return this;
  }

  // 일시정지 추가
  addPause(duration: number): this {
    this.ssml += `<break time="${duration}ms"/>`;
    return this;
  }

  // 강조 추가
  addEmphasis(text: string, level: 'strong' | 'moderate' | 'reduced' = 'moderate'): this {
    this.ssml += `<emphasis level="${level}">${text}</emphasis>`;
    return this;
  }

  // 속삭임 효과
  addWhisper(text: string): this {
    this.ssml += `<amazon:effect name="whispered">${text}</amazon:effect>`;
    return this;
  }

  // 감정 표현
  addEmotion(text: string, emotion: 'happy' | 'sad' | 'excited' | 'calm'): this {
    const emotionSettings = {
      happy: { rate: '110%', pitch: '+10%' },
      sad: { rate: '90%', pitch: '-10%' },
      excited: { rate: '120%', pitch: '+15%' },
      calm: { rate: '85%', pitch: '-5%' }
    };
    
    const settings = emotionSettings[emotion];
    this.ssml += `<prosody rate="${settings.rate}" pitch="${settings.pitch}">${text}</prosody>`;
    return this;
  }

  build(): string {
    return this.ssml + '</speak>';
  }
}
```

### 3. 고급 음성 설정

#### C. 세밀한 음성 파라미터
```typescript
// lib/advanced-tts-config.ts
export interface AdvancedTTSConfig {
  // 기본 설정
  voice: string;
  language: string;
  
  // 음성 특성
  speaking_rate: number;      // 0.5 ~ 2.0 (1.0이 기본)
  pitch: number;              // -20 ~ 20 (0이 기본)
  volume_gain_db: number;     // -20 ~ 20 (0이 기본)
  
  // 발음 스타일
  pronunciation_style: {
    articulation: 'clear' | 'natural' | 'casual';  // 발음 명확도
    intonation: 'dynamic' | 'flat' | 'expressive'; // 억양 변화
    rhythm: 'steady' | 'variable' | 'natural';     // 리듬감
  };
  
  // 감정 표현
  emotion: {
    type: 'neutral' | 'happy' | 'sad' | 'angry' | 'calm' | 'excited';
    intensity: number; // 0 ~ 1
  };
  
  // 호흡과 일시정지
  breathing: {
    enable: boolean;
    natural_pauses: boolean;
    pause_between_sentences: number; // ms
  };
  
  // 배경음
  background: {
    ambient_sound?: 'silence' | 'office' | 'outdoor' | 'studio';
    noise_reduction: boolean;
  };
}

// 시나리오별 프리셋
export const TTSPresets = {
  // 나레이션용 (차분하고 명확한)
  narration: {
    speaking_rate: 0.95,
    pitch: -2,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'steady'
    },
    emotion: { type: 'neutral', intensity: 0.3 },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 800
    }
  },
  
  // 광고용 (활기차고 밝은)
  advertisement: {
    speaking_rate: 1.1,
    pitch: 5,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'expressive',
      rhythm: 'variable'
    },
    emotion: { type: 'excited', intensity: 0.7 },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 500
    }
  },
  
  // 교육용 (친근하고 이해하기 쉬운)
  educational: {
    speaking_rate: 0.9,
    pitch: 0,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'natural'
    },
    emotion: { type: 'happy', intensity: 0.4 },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 1000
    }
  },
  
  // 뉴스용 (전문적이고 신뢰감 있는)
  news: {
    speaking_rate: 1.0,
    pitch: -3,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'flat',
      rhythm: 'steady'
    },
    emotion: { type: 'neutral', intensity: 0.1 },
    breathing: {
      enable: true,
      natural_pauses: false,
      pause_between_sentences: 600
    }
  }
};
```

### 4. 실제 구현 예시

#### D. 개선된 TTS 엔진
```typescript
// lib/enhanced-gemini-tts.ts
import { GeminiTTSEngine } from './gemini-tts';
import { TTSTextPreprocessor } from './tts-text-preprocessor';
import { SSMLBuilder } from './ssml-builder';
import { AdvancedTTSConfig, TTSPresets } from './advanced-tts-config';

export class EnhancedGeminiTTS extends GeminiTTSEngine {
  private preprocessor = new TTSTextPreprocessor();

  async generateNaturalSpeech(
    text: string,
    preset: keyof typeof TTSPresets = 'narration',
    customConfig?: Partial<AdvancedTTSConfig>
  ) {
    // 1. 프리셋 적용
    const config = {
      ...TTSPresets[preset],
      ...customConfig
    };

    // 2. 텍스트 전처리
    let processedText = text;
    processedText = this.preprocessor.convertNumbersToKorean(processedText);
    processedText = this.preprocessor.convertEnglishToKorean(processedText);
    processedText = this.preprocessor.addNaturalPauses(processedText);

    // 3. SSML 빌드
    const ssmlBuilder = new SSMLBuilder();
    const sentences = processedText.split(/[.!?]+/);
    
    sentences.forEach((sentence, index) => {
      if (sentence.trim()) {
        // 문장별로 다른 설정 적용
        const isQuestion = sentence.includes('?');
        const isExclamation = sentence.includes('!');
        
        ssmlBuilder.addSentence(sentence, {
          speed: config.speaking_rate * 100,
          pitch: isQuestion ? config.pitch + 5 : config.pitch,
          volume: isExclamation ? 5 : 0
        });
        
        // 문장 사이 일시정지
        if (index < sentences.length - 1) {
          ssmlBuilder.addPause(config.breathing.pause_between_sentences);
        }
      }
    });

    const ssmlText = ssmlBuilder.build();

    // 4. Gemini TTS 호출
    const result = await this.textToSpeech({
      text: ssmlText,
      voice: config.voice || 'Kore',
      speed: 'normal', // SSML에서 제어하므로 기본값 사용
      style: config.emotion.type as any,
      language: config.language || 'ko'
    });

    return result;
  }

  // 영상 나레이션용 특화 메서드
  async generateVideoNarration(
    script: string,
    videoType: 'tutorial' | 'story' | 'advertisement' | 'educational'
  ) {
    const presetMap = {
      tutorial: 'educational',
      story: 'narration',
      advertisement: 'advertisement',
      educational: 'educational'
    };

    const preset = presetMap[videoType] as keyof typeof TTSPresets;
    
    // 영상 타입별 추가 최적화
    const customConfig: Partial<AdvancedTTSConfig> = {};
    
    if (videoType === 'tutorial') {
      customConfig.speaking_rate = 0.85; // 더 천천히
      customConfig.breathing = {
        enable: true,
        natural_pauses: true,
        pause_between_sentences: 1200 // 더 긴 일시정지
      };
    }

    return this.generateNaturalSpeech(script, preset, customConfig);
  }
}
```

### 5. UI 개선 사항

#### E. 고급 설정 UI
```typescript
// components/advanced-tts-ui.tsx
// 추가할 UI 요소들:

1. **프리셋 선택**
   - 나레이션 / 광고 / 교육 / 뉴스

2. **세부 조정**
   - 속도: 슬라이더 (0.5x ~ 2.0x)
   - 음높이: 슬라이더 (-20 ~ +20)
   - 감정 강도: 슬라이더 (0 ~ 100%)

3. **발음 스타일**
   - 명확도: 명확함 / 자연스러움 / 캐주얼
   - 억양: 다이나믹 / 평탄함 / 표현력 있음

4. **일시정지 설정**
   - 문장 사이 간격: 슬라이더 (200ms ~ 2000ms)
   - 자연스러운 호흡: 체크박스

5. **미리보기**
   - 실시간 SSML 미리보기
   - 파형 시각화
```

## 📝 사용 예시

### 자동차 정비 영상 나레이션
```typescript
const tts = new EnhancedGeminiTTS();

const script = `
오늘 입고된 차는 BMW X5 차량입니다.
1억이 넘어가는 고가의 차량이 휠 기스로 인해서 들어오는 모습이 상당히 가슴이 아팠습니다.
일단 유분 제거를 철저히 해주고, 세척과 샌딩 후 전용 컷팅을 해서 작업을 했더니
다시금 신차급 퍼포먼스를 보여줍니다.
`;

const audio = await tts.generateVideoNarration(script, 'tutorial');
```

## 🎯 권장 설정

### 영상 타입별 최적 설정

| 영상 타입 | 속도 | 음높이 | 감정 | 일시정지 |
|---------|------|--------|------|----------|
| 튜토리얼 | 0.85x | 0 | 친근함 | 1200ms |
| 스토리 | 0.95x | -2 | 중립 | 800ms |
| 광고 | 1.1x | +5 | 활기참 | 500ms |
| 교육 | 0.9x | 0 | 차분함 | 1000ms |

## 🚀 다음 단계

1. **실제 Gemini TTS API 연동**
   - Google Cloud TTS API 또는 Gemini Audio API 사용
   - 더 많은 한국어 음성 옵션

2. **음성 후처리**
   - 노이즈 제거
   - 음량 정규화
   - 배경음악 믹싱

3. **A/B 테스트**
   - 다양한 설정으로 생성된 음성 비교
   - 사용자 피드백 수집

---

*이 가이드는 AI Shorts Maker의 자연스러운 음성 제작을 위한 제안사항입니다.*