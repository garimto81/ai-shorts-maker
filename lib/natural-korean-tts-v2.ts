// 자연스러운 한국어 TTS 설정 v2
// ElevenLabs 분석 결과를 반영한 개선된 설정

export interface NaturalKoreanVoiceSettings {
  voice_id: string;
  name: string;
  description: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  model_id: string;
  language_code: string;
}

// 연구 결과: style 파라미터를 0으로 유지하는 것이 한국어에서 더 자연스러움
export const NATURAL_KOREAN_VOICES: Record<string, NaturalKoreanVoiceSettings> = {
  // 가장 자연스러운 여성 음성 (Rachel)
  natural_female: {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel - 자연스러운 여성',
    description: '한국어에 가장 적합한 자연스러운 여성 음성',
    voice_settings: {
      stability: 0.52,           // 한국어 억양에 최적화
      similarity_boost: 0.68,    // 자연스러운 톤 유지
      style: 0.0,               // 0으로 설정 (안정성)
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2',
    language_code: 'ko'
  },

  // 친근한 여성 음성 (Bella)
  warm_female: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella - 따뜻한 여성',
    description: '친근하고 부드러운 한국어 음성',
    voice_settings: {
      stability: 0.58,
      similarity_boost: 0.70,
      style: 0.0,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2',
    language_code: 'ko'
  },

  // 활기찬 여성 음성 (Elli) - 광고용
  energetic_female: {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli - 활기찬 여성',
    description: '밝고 생동감 있는 광고/프로모션용',
    voice_settings: {
      stability: 0.48,          // 더 다이나믹하게
      similarity_boost: 0.65,
      style: 0.0,              // 안정성을 위해 0 유지
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2',
    language_code: 'ko'
  },

  // 전문적인 남성 음성 (Adam)
  professional_male: {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam - 전문가 남성',
    description: '차분하고 신뢰감 있는 설명/교육용',
    voice_settings: {
      stability: 0.65,          // 안정적이면서도 자연스럽게
      similarity_boost: 0.72,
      style: 0.0,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2',
    language_code: 'ko'
  },

  // 젊은 남성 음성 (Josh)
  casual_male: {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh - 캐주얼 남성',
    description: '친근하고 젊은 느낌의 리뷰/브이로그용',
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.68,
      style: 0.0,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2',
    language_code: 'ko'
  }
};

// 한국어 텍스트 전처리 개선
export function preprocessKoreanText(text: string): string {
  let processed = text;

  // 1. 숫자를 한글로 변환 (더 자연스럽게)
  const numberMap: Record<string, string> = {
    '0': '영', '1': '일', '2': '이', '3': '삼', '4': '사',
    '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구',
    '10': '십', '11': '십일', '12': '십이', '20': '이십',
    '30': '삼십', '50': '오십', '100': '백'
  };

  // 년도 변환
  processed = processed.replace(/(\d{4})년/g, (match, year) => {
    const y = parseInt(year);
    if (y === 2025) return '이천이십오년';
    if (y === 2024) return '이천이십사년';
    if (y === 2023) return '이천이십삼년';
    return match;
  });

  // 2. 영어 단어를 한글 발음으로 (확장)
  const pronunciationMap: Record<string, string> = {
    'BMW': '비엠더블유',
    'AI': '에이아이',
    'DIY': '디아이와이',
    'TV': '티비',
    'PC': '피씨',
    'USB': '유에스비',
    'LED': '엘이디',
    'GPS': '지피에스',
    'Wi-Fi': '와이파이',
    'YouTube': '유튜브',
    'Instagram': '인스타그램',
    'Facebook': '페이스북'
  };

  Object.entries(pronunciationMap).forEach(([eng, kor]) => {
    processed = processed.replace(new RegExp(eng, 'gi'), kor);
  });

  // 3. 자연스러운 쉼표 추가 (중요!)
  processed = processed
    .replace(/\./g, '..')  // 문장 끝에 짧은 쉼
    .replace(/!/g, '!.')   // 느낌표 뒤에도 쉼
    .replace(/\?/g, '?.')  // 물음표 뒤에도 쉼
    .replace(/,/g, ',.');  // 쉼표에 약간의 쉼

  // 4. 너무 긴 문장 분리
  if (processed.length > 50 && !processed.includes('.')) {
    // 50자 이상이고 마침표가 없으면 중간에 쉼 추가
    const midPoint = Math.floor(processed.length / 2);
    const spaceIndex = processed.indexOf(' ', midPoint);
    if (spaceIndex > -1) {
      processed = processed.substring(0, spaceIndex) + '..' + processed.substring(spaceIndex);
    }
  }

  return processed;
}

// 비디오 타입별 최적 음성 선택
export function selectBestVoiceForContent(videoType: string): NaturalKoreanVoiceSettings {
  const voiceMap: Record<string, string> = {
    'auto_repair': 'professional_male',     // 전문적인 설명
    'tutorial': 'natural_female',           // 친근한 튜토리얼
    'advertisement': 'energetic_female',    // 활기찬 광고
    'narration': 'warm_female',            // 따뜻한 나레이션
    'educational': 'professional_male',     // 교육 콘텐츠
    'vlog': 'casual_male',                 // 캐주얼한 브이로그
    'review': 'natural_female',            // 제품 리뷰
    'news': 'professional_male'            // 뉴스/정보
  };

  const selectedVoice = voiceMap[videoType] || 'natural_female';
  return NATURAL_KOREAN_VOICES[selectedVoice];
}

// SSML 태그를 사용한 자연스러운 억양 추가
export function addNaturalProsody(text: string, emotion?: 'neutral' | 'happy' | 'excited'): string {
  // ElevenLabs는 SSML을 지원하지 않으므로 텍스트 기반 처리
  let processed = text;

  switch (emotion) {
    case 'happy':
      // 밝은 톤을 위해 느낌표 추가
      processed = processed.replace(/\./g, '!');
      break;
    case 'excited':
      // 더 강한 감정 표현
      processed = processed.replace(/\./g, '!!');
      processed = processed.replace(/,/g, '!');
      break;
  }

  return processed;
}

// 한국어 억양 패턴 분석 결과
export const KOREAN_PROSODY_TIPS = {
  natural_rhythm: [
    '문장을 20-30자 단위로 끊어서 처리',
    '조사(은/는/이/가) 뒤에 미세한 쉼 추가',
    '접속사 앞뒤로 자연스러운 쉼 추가'
  ],
  
  avoid_robotic: [
    'style 파라미터는 반드시 0으로 설정',
    'stability는 0.45-0.65 범위 유지',
    '너무 긴 문장은 분할 처리'
  ],
  
  best_practices: [
    'Rachel(21m00Tcm4TlvDq8ikWAM)이 한국어에 가장 자연스러움',
    '광고/프로모션은 Elli 음성 사용',
    '교육/설명은 Adam 음성 사용'
  ]
};