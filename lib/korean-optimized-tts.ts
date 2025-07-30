// 한국어 최적화 TTS 설정
// 더 자연스럽고 생동감 있는 한국어 음성을 위한 설정

export interface KoreanVoiceSettings {
  voice_id: string;
  name: string;
  description: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  optimization_tips: string[];
}

// 한국어에 최적화된 음성 설정
export const KOREAN_OPTIMIZED_VOICES: Record<string, KoreanVoiceSettings> = {
  // 신나고 통통 튀는 여성 음성
  energetic_female: {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
    name: 'Elli (활기찬 여성)',
    description: '밝고 경쾌한 톤으로 광고나 재미있는 콘텐츠에 적합',
    voice_settings: {
      stability: 0.45,        // 낮춰서 더 다이나믹하게
      similarity_boost: 0.65, // 약간 낮춰서 더 자연스럽게
      style: 0.95,           // 매우 높여서 감정 표현 극대화
      use_speaker_boost: true
    },
    optimization_tips: [
      '문장 끝에 느낌표를 사용하여 활기 추가',
      '짧은 문장으로 끊어서 리듬감 생성',
      'ㅋㅋㅋ, ㅎㅎㅎ 같은 표현은 제거'
    ]
  },

  // 친근하고 따뜻한 여성 음성
  friendly_female: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella
    name: 'Bella (친근한 여성)',
    description: '부드럽고 따뜻한 톤으로 튜토리얼이나 안내에 적합',
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.70,
      style: 0.75,
      use_speaker_boost: true
    },
    optimization_tips: [
      '~요, ~네요 같은 친근한 어미 사용',
      '적절한 쉼표로 자연스러운 호흡 표현'
    ]
  },

  // 젊고 발랄한 여성 음성
  youthful_female: {
    voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi
    name: 'Domi (젊은 여성)',
    description: '젊고 발랄한 톤으로 유튜브 콘텐츠에 적합',
    voice_settings: {
      stability: 0.50,
      similarity_boost: 0.68,
      style: 0.85,
      use_speaker_boost: true
    },
    optimization_tips: [
      '감탄사를 적절히 활용',
      '억양 변화를 위해 문장 구조 다양화'
    ]
  },

  // 캐주얼한 남성 음성
  casual_male: {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh
    name: 'Josh (캐주얼 남성)',
    description: '젊고 캐주얼한 남성 톤으로 브이로그나 리뷰에 적합',
    voice_settings: {
      stability: 0.60,
      similarity_boost: 0.72,
      style: 0.70,
      use_speaker_boost: true
    },
    optimization_tips: [
      '구어체 표현 활용',
      '자연스러운 말투 유지'
    ]
  },

  // 전문적인 남성 음성
  professional_male: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam
    name: 'Adam (전문가)',
    description: '신뢰감 있는 톤으로 교육이나 기술 설명에 적합',
    voice_settings: {
      stability: 0.70,
      similarity_boost: 0.75,
      style: 0.50,
      use_speaker_boost: true
    },
    optimization_tips: [
      '명확한 발음을 위해 문장 구조 정리',
      '전문 용어는 천천히 발음되도록 조정'
    ]
  }
};

// 텍스트를 더 자연스러운 한국어로 변환
export function optimizeKoreanText(text: string, voiceType: string): string {
  let optimizedText = text;

  // 기본 최적화
  // 1. 숫자를 한글로 변환 (간단한 경우)
  optimizedText = optimizedText
    .replace(/(\d{4})년/g, (match, year) => {
      // 2025년 -> 이천이십오년
      return convertYearToKorean(year) + '년';
    })
    .replace(/(\d{1,2})월/g, (match, month) => {
      // 12월 -> 십이월
      return convertMonthToKorean(month) + '월';
    });

  // 2. 영어 브랜드명 한글 발음으로 변환
  const brandMap: Record<string, string> = {
    'BMW': '비엠더블유',
    'AI': '에이아이',
    'DIY': '디아이와이',
    'API': '에이피아이',
    'TTS': '티티에스',
    'URL': '유알엘',
    'PDF': '피디에프'
  };

  Object.entries(brandMap).forEach(([eng, kor]) => {
    optimizedText = optimizedText.replace(new RegExp(eng, 'g'), kor);
  });

  // 3. 음성 타입별 추가 최적화
  if (voiceType === 'energetic_female' || voiceType === 'youthful_female') {
    // 신나는 느낌을 위해 문장 끝 조정
    optimizedText = optimizedText
      .replace(/입니다\./g, '입니다!')
      .replace(/하세요\./g, '하세요!')
      .replace(/있어요\./g, '있어요!');
    
    // 긴 문장을 짧게 나누기
    optimizedText = optimizedText.replace(/,\s*/g, '. ');
  }

  // 4. 자연스러운 쉼 추가
  optimizedText = optimizedText
    .replace(/\. /g, '... ')  // 문장 끝에 자연스러운 쉼
    .replace(/! /g, '! ... '); // 느낌표 뒤에도 쉼 추가

  return optimizedText;
}

// 연도를 한글로 변환
function convertYearToKorean(year: string): string {
  const yearNum = parseInt(year);
  if (yearNum === 2025) return '이천이십오';
  if (yearNum === 2024) return '이천이십사';
  if (yearNum === 2023) return '이천이십삼';
  return year; // 기타 연도는 그대로
}

// 월을 한글로 변환
function convertMonthToKorean(month: string): string {
  const monthMap: Record<string, string> = {
    '1': '일', '2': '이', '3': '삼', '4': '사', '5': '오',
    '6': '육', '7': '칠', '8': '팔', '9': '구', '10': '십',
    '11': '십일', '12': '십이'
  };
  return monthMap[month] || month;
}

// 감정 표현을 위한 SSML 태그 추가
export function addEmotionSSML(text: string, emotion: 'excited' | 'friendly' | 'professional'): string {
  let ssml = `<speak>`;
  
  switch (emotion) {
    case 'excited':
      ssml += `<prosody rate="110%" pitch="+5%">`;
      ssml += text.replace(/!/g, '<emphasis level="strong">!</emphasis>');
      ssml += `</prosody>`;
      break;
      
    case 'friendly':
      ssml += `<prosody rate="100%" pitch="+2%">`;
      ssml += text.replace(/\.\.\./g, '<break time="500ms"/>');
      ssml += `</prosody>`;
      break;
      
    case 'professional':
      ssml += `<prosody rate="95%" pitch="0%">`;
      ssml += text.replace(/\.\.\./g, '<break time="300ms"/>');
      ssml += `</prosody>`;
      break;
  }
  
  ssml += `</speak>`;
  return ssml;
}

// 최적화된 음성 설정 가져오기
export function getOptimizedVoiceSettings(purpose: string): KoreanVoiceSettings {
  const purposeMap: Record<string, string> = {
    'advertisement': 'energetic_female',
    'tutorial': 'friendly_female',
    'vlog': 'youthful_female',
    'review': 'casual_male',
    'education': 'professional_male',
    'auto_repair': 'professional_male',
    'narration': 'professional_male'
  };
  
  const voiceType = purposeMap[purpose] || 'friendly_female';
  return KOREAN_OPTIMIZED_VOICES[voiceType];
}