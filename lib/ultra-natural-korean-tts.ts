// 초자연스러운 한국어 TTS - 고급 억양 최적화
// 한국어 화자의 실제 말하기 패턴 분석 기반

import { KoreanTextPreprocessor } from './natural-korean-tts-v3';

export interface UltraNaturalKoreanConfig {
  // 문장 타입별 억양 패턴
  sentenceType: 'statement' | 'question' | 'exclamation' | 'command';
  // 감정 상태
  emotion: 'neutral' | 'happy' | 'excited' | 'sad' | 'angry' | 'surprised';
  // 말하기 속도
  speechRate: 'slow' | 'normal' | 'fast';
  // 포즈 패턴
  pausePattern: 'natural' | 'dramatic' | 'conversational' | 'broadcast';
}

// 한국어 억양 패턴 라이브러리
export class KoreanProsodyPatterns {
  
  // 1. 문장 끝 억양 패턴 (한국어 특유의 어미 처리)
  static applySentenceEndingPattern(text: string): string {
    // 평서문 - 자연스럽게 내려가는 억양
    text = text.replace(/입니다\./g, '입니다<prosody pitch="-10%">.</prosody>');
    text = text.replace(/습니다\./g, '습니다<prosody pitch="-10%">.</prosody>');
    text = text.replace(/어요\./g, '어요<prosody pitch="-5%">.</prosody>');
    text = text.replace(/아요\./g, '아요<prosody pitch="-5%">.</prosody>');
    
    // 의문문 - 올라가는 억양
    text = text.replace(/습니까\?/g, '<prosody pitch="+15%">습니까?</prosody>');
    text = text.replace(/나요\?/g, '<prosody pitch="+20%">나요?</prosody>');
    text = text.replace(/까요\?/g, '<prosody pitch="+20%">까요?</prosody>');
    
    // 감탄문 - 강한 강조
    text = text.replace(/네요!/g, '<prosody pitch="+10%" rate="110%">네요!</prosody>');
    text = text.replace(/군요!/g, '<prosody pitch="+10%" rate="110%">군요!</prosody>');
    
    return text;
  }
  
  // 2. 조사와 어절 경계 처리 (한국어 리듬)
  static applyKoreanRhythm(text: string): string {
    // 주요 조사 뒤에 미세한 쉼 추가 (자연스러운 끊어읽기)
    const particles = ['은', '는', '이', '가', '을', '를', '에', '에서', '으로', '와', '과'];
    
    particles.forEach(particle => {
      const regex = new RegExp(`(${particle})\\s`, 'g');
      text = text.replace(regex, `$1<break time="50ms"/> `);
    });
    
    // 접속사 앞뒤로 자연스러운 쉼
    text = text.replace(/그리고/g, '<break time="200ms"/>그리고<break time="100ms"/>');
    text = text.replace(/하지만/g, '<break time="200ms"/>하지만<break time="100ms"/>');
    text = text.replace(/그래서/g, '<break time="200ms"/>그래서<break time="100ms"/>');
    text = text.replace(/그런데/g, '<break time="200ms"/>그런데<break time="100ms"/>');
    
    return text;
  }
  
  // 3. 강조 단어 자동 감지 및 처리
  static applyEmphasisPatterns(text: string): string {
    // 부사 강조
    const emphasisAdverbs = ['정말', '진짜', '너무', '매우', '아주', '완전', '굉장히'];
    emphasisAdverbs.forEach(adverb => {
      text = text.replace(new RegExp(adverb, 'g'), 
        `<emphasis level="moderate"><prosody rate="95%">${adverb}</prosody></emphasis>`);
    });
    
    // 지시어 강조
    text = text.replace(/이것/g, '<emphasis>이것</emphasis>');
    text = text.replace(/저것/g, '<emphasis>저것</emphasis>');
    text = text.replace(/여기/g, '<emphasis>여기</emphasis>');
    text = text.replace(/거기/g, '<emphasis>거기</emphasis>');
    
    return text;
  }
  
  // 4. 대화체 자연스러움 추가
  static applyConversationalTone(text: string): string {
    // 대화 시작 부분 - 부드럽게
    if (text.startsWith('안녕')) {
      text = `<prosody rate="95%" pitch="+5%">${text.substring(0, 2)}</prosody>${text.substring(2)}`;
    }
    
    // 호칭 뒤 자연스러운 쉼
    text = text.replace(/씨,/g, '씨<break time="150ms"/>,');
    text = text.replace(/님,/g, '님<break time="150ms"/>,');
    
    // 감정 표현 강화
    text = text.replace(/아~/g, '<prosody pitch="+10%" rate="90%">아~</prosody>');
    text = text.replace(/음~/g, '<prosody pitch="-5%" rate="85%">음~</prosody>');
    
    return text;
  }
  
  // 5. 숫자와 단위 읽기 최적화
  static optimizeNumberReading(text: string): string {
    // 가격 읽기 - 자연스러운 끊어읽기
    text = text.replace(/(\d+)원/g, (match, num) => {
      if (num.length > 4) {
        // 만원 단위로 끊어읽기
        return `${num}<break time="100ms"/>원`;
      }
      return match;
    });
    
    // 퍼센트 읽기
    text = text.replace(/(\d+)%/g, '$1<break time="50ms"/>퍼센트');
    
    // 시간 읽기
    text = text.replace(/(\d+)시/g, '$1시<break time="100ms"/>');
    text = text.replace(/(\d+)분/g, '$1분<break time="50ms"/>');
    
    return text;
  }
  
  // 6. 문맥 기반 억양 조정
  static applyContextualIntonation(text: string, context: UltraNaturalKoreanConfig): string {
    let ssml = '<speak>';
    
    // 감정별 기본 프로소디 설정
    const emotionProsody = {
      neutral: { rate: '100%', pitch: '0%', volume: 'medium' },
      happy: { rate: '105%', pitch: '+5%', volume: 'medium' },
      excited: { rate: '110%', pitch: '+10%', volume: 'loud' },
      sad: { rate: '95%', pitch: '-5%', volume: 'soft' },
      angry: { rate: '105%', pitch: '+5%', volume: 'loud' },
      surprised: { rate: '110%', pitch: '+15%', volume: 'medium' }
    };
    
    const prosody = emotionProsody[context.emotion];
    ssml += `<prosody rate="${prosody.rate}" pitch="${prosody.pitch}" volume="${prosody.volume}">`;
    
    // 문장 타입별 추가 처리
    switch (context.sentenceType) {
      case 'question':
        // 의문문은 끝을 더 올림
        text = text.replace(/\?$/, '<prosody pitch="+20%">?</prosody>');
        break;
      case 'exclamation':
        // 감탄문은 더 강하게
        text = text.replace(/!$/, '<prosody pitch="+15%" rate="110%">!</prosody>');
        break;
      case 'command':
        // 명령문은 단호하게
        text = `<prosody rate="95%" pitch="-5%">${text}</prosody>`;
        break;
    }
    
    ssml += text;
    ssml += '</prosody></speak>';
    
    return ssml;
  }
}

// 초자연스러운 한국어 텍스트 전처리기
export class UltraNaturalKoreanPreprocessor {
  
  static process(text: string, config: UltraNaturalKoreanConfig): string {
    // 1. 기본 전처리 (숫자, 영어 등)
    text = KoreanTextPreprocessor.normalizeNumbers(text);
    text = KoreanTextPreprocessor.fixPronunciation(text);
    
    // 2. 한국어 리듬 패턴 적용
    text = KoreanProsodyPatterns.applyKoreanRhythm(text);
    
    // 3. 문장 끝 억양 패턴
    text = KoreanProsodyPatterns.applySentenceEndingPattern(text);
    
    // 4. 강조 패턴
    text = KoreanProsodyPatterns.applyEmphasisPatterns(text);
    
    // 5. 대화체 톤
    if (config.pausePattern === 'conversational') {
      text = KoreanProsodyPatterns.applyConversationalTone(text);
    }
    
    // 6. 숫자 최적화
    text = KoreanProsodyPatterns.optimizeNumberReading(text);
    
    // 7. 문맥 기반 최종 조정
    text = KoreanProsodyPatterns.applyContextualIntonation(text, config);
    
    return text;
  }
  
  // 문장 분석 헬퍼
  static analyzeSentence(text: string): UltraNaturalKoreanConfig {
    // 문장 타입 자동 감지
    let sentenceType: UltraNaturalKoreanConfig['sentenceType'] = 'statement';
    if (text.includes('?')) sentenceType = 'question';
    else if (text.includes('!')) sentenceType = 'exclamation';
    else if (text.includes('세요') || text.includes('십시오')) sentenceType = 'command';
    
    // 감정 추측 (키워드 기반)
    let emotion: UltraNaturalKoreanConfig['emotion'] = 'neutral';
    if (text.includes('기쁘') || text.includes('좋')) emotion = 'happy';
    else if (text.includes('신나') || text.includes('대박')) emotion = 'excited';
    else if (text.includes('슬프') || text.includes('아쉽')) emotion = 'sad';
    else if (text.includes('화나') || text.includes('짜증')) emotion = 'angry';
    else if (text.includes('놀라') || text.includes('깜짝')) emotion = 'surprised';
    
    return {
      sentenceType,
      emotion,
      speechRate: 'normal',
      pausePattern: 'natural'
    };
  }
}

// 프리셋 설정
export const ULTRA_NATURAL_PRESETS = {
  // 일상 대화
  casual_conversation: {
    sentenceType: 'statement' as const,
    emotion: 'neutral' as const,
    speechRate: 'normal' as const,
    pausePattern: 'conversational' as const
  },
  
  // 뉴스 앵커
  news_anchor: {
    sentenceType: 'statement' as const,
    emotion: 'neutral' as const,
    speechRate: 'normal' as const,
    pausePattern: 'broadcast' as const
  },
  
  // 감정적인 스토리텔링
  emotional_story: {
    sentenceType: 'statement' as const,
    emotion: 'happy' as const,
    speechRate: 'slow' as const,
    pausePattern: 'dramatic' as const
  },
  
  // 긴급 공지
  urgent_announcement: {
    sentenceType: 'exclamation' as const,
    emotion: 'excited' as const,
    speechRate: 'fast' as const,
    pausePattern: 'natural' as const
  }
};

// ElevenLabs API 요청 생성기
export function createUltraNaturalRequest(text: string, preset?: keyof typeof ULTRA_NATURAL_PRESETS) {
  const config = preset ? ULTRA_NATURAL_PRESETS[preset] : UltraNaturalKoreanPreprocessor.analyzeSentence(text);
  const processedText = UltraNaturalKoreanPreprocessor.process(text, config);
  
  return {
    text: processedText,
    model_id: "eleven_multilingual_v2",
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - 가장 자연스러운 한국어
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.65,
      style: 0,
      use_speaker_boost: true
    },
    enable_ssml_parsing: true
  };
}