// 고급 TTS 설정 - 세밀한 음성 제어를 위한 설정 구조

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
    type: 'neutral' | 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'professional' | 'cheerful';
    intensity: number; // 0 ~ 1
  };
  
  // 호흡과 일시정지
  breathing: {
    enable: boolean;
    natural_pauses: boolean;
    pause_between_sentences: number; // ms
    pause_after_comma: number; // ms
    pause_after_period: number; // ms
  };
  
  // 배경음 및 효과
  background: {
    ambient_sound?: 'silence' | 'office' | 'outdoor' | 'studio';
    noise_reduction: boolean;
    echo_cancellation: boolean;
  };
  
  // 후처리 옵션
  post_processing: {
    normalize_volume: boolean;
    remove_silence: boolean;
    enhance_clarity: boolean;
    compress_dynamic_range: boolean;
  };
}

// 시나리오별 프리셋
export const TTSPresets: Record<string, Partial<AdvancedTTSConfig>> = {
  // 자동차 정비 나레이션용 (전문적이고 신뢰감 있는)
  auto_repair_narration: {
    speaking_rate: 0.92,
    pitch: -2,
    volume_gain_db: 2,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'steady'
    },
    emotion: {
      type: 'professional',
      intensity: 0.6
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 800,
      pause_after_comma: 300,
      pause_after_period: 1000
    },
    background: {
      ambient_sound: 'studio',
      noise_reduction: true,
      echo_cancellation: true
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: false,
      enhance_clarity: true,
      compress_dynamic_range: true
    }
  },
  
  // 일반 나레이션용 (차분하고 명확한)
  narration: {
    speaking_rate: 0.95,
    pitch: -2,
    volume_gain_db: 0,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'steady'
    },
    emotion: {
      type: 'neutral',
      intensity: 0.3
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 800,
      pause_after_comma: 300,
      pause_after_period: 900
    },
    background: {
      ambient_sound: 'silence',
      noise_reduction: true,
      echo_cancellation: false
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: false,
      enhance_clarity: false,
      compress_dynamic_range: false
    }
  },
  
  // 광고용 (활기차고 밝은)
  advertisement: {
    speaking_rate: 1.1,
    pitch: 5,
    volume_gain_db: 3,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'expressive',
      rhythm: 'variable'
    },
    emotion: {
      type: 'excited',
      intensity: 0.7
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 500,
      pause_after_comma: 200,
      pause_after_period: 600
    },
    background: {
      ambient_sound: 'silence',
      noise_reduction: true,
      echo_cancellation: true
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: true,
      enhance_clarity: true,
      compress_dynamic_range: true
    }
  },
  
  // 교육용 (친근하고 이해하기 쉬운)
  educational: {
    speaking_rate: 0.9,
    pitch: 0,
    volume_gain_db: 1,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'natural'
    },
    emotion: {
      type: 'cheerful',
      intensity: 0.4
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 1000,
      pause_after_comma: 400,
      pause_after_period: 1200
    },
    background: {
      ambient_sound: 'silence',
      noise_reduction: true,
      echo_cancellation: false
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: false,
      enhance_clarity: true,
      compress_dynamic_range: false
    }
  },
  
  // 뉴스용 (전문적이고 신뢰감 있는)
  news: {
    speaking_rate: 1.0,
    pitch: -3,
    volume_gain_db: 2,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'flat',
      rhythm: 'steady'
    },
    emotion: {
      type: 'neutral',
      intensity: 0.1
    },
    breathing: {
      enable: true,
      natural_pauses: false,
      pause_between_sentences: 600,
      pause_after_comma: 200,
      pause_after_period: 700
    },
    background: {
      ambient_sound: 'studio',
      noise_reduction: true,
      echo_cancellation: true
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: true,
      enhance_clarity: true,
      compress_dynamic_range: true
    }
  },
  
  // 스토리텔링용 (감정이 풍부한)
  storytelling: {
    speaking_rate: 0.93,
    pitch: 2,
    volume_gain_db: 1,
    pronunciation_style: {
      articulation: 'natural',
      intonation: 'expressive',
      rhythm: 'variable'
    },
    emotion: {
      type: 'happy',
      intensity: 0.5
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 900,
      pause_after_comma: 350,
      pause_after_period: 1100
    },
    background: {
      ambient_sound: 'silence',
      noise_reduction: true,
      echo_cancellation: false
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: false,
      enhance_clarity: false,
      compress_dynamic_range: false
    }
  },
  
  // 튜토리얼용 (명확하고 따라하기 쉬운)
  tutorial: {
    speaking_rate: 0.85,
    pitch: 0,
    volume_gain_db: 2,
    pronunciation_style: {
      articulation: 'clear',
      intonation: 'dynamic',
      rhythm: 'steady'
    },
    emotion: {
      type: 'calm',
      intensity: 0.4
    },
    breathing: {
      enable: true,
      natural_pauses: true,
      pause_between_sentences: 1200,
      pause_after_comma: 500,
      pause_after_period: 1500
    },
    background: {
      ambient_sound: 'silence',
      noise_reduction: true,
      echo_cancellation: false
    },
    post_processing: {
      normalize_volume: true,
      remove_silence: false,
      enhance_clarity: true,
      compress_dynamic_range: false
    }
  }
};

// 영상 타입별 추천 프리셋
export const VideoTypePresets: Record<string, string> = {
  'auto_repair': 'auto_repair_narration',
  'tutorial': 'tutorial',
  'story': 'storytelling',
  'advertisement': 'advertisement',
  'educational': 'educational',
  'news': 'news',
  'documentary': 'narration'
};

// TTS 설정 빌더 헬퍼 클래스
export class TTSConfigBuilder {
  private config: Partial<AdvancedTTSConfig> = {};

  constructor(preset?: keyof typeof TTSPresets) {
    if (preset && TTSPresets[preset]) {
      this.config = { ...TTSPresets[preset] };
    } else {
      // 기본값 설정
      this.config = {
        speaking_rate: 1.0,
        pitch: 0,
        volume_gain_db: 0,
        pronunciation_style: {
          articulation: 'natural',
          intonation: 'dynamic',
          rhythm: 'natural'
        },
        emotion: {
          type: 'neutral',
          intensity: 0.3
        },
        breathing: {
          enable: true,
          natural_pauses: true,
          pause_between_sentences: 800,
          pause_after_comma: 300,
          pause_after_period: 900
        },
        background: {
          ambient_sound: 'silence',
          noise_reduction: true,
          echo_cancellation: false
        },
        post_processing: {
          normalize_volume: true,
          remove_silence: false,
          enhance_clarity: false,
          compress_dynamic_range: false
        }
      };
    }
  }

  // 체이닝 메서드들
  setSpeakingRate(rate: number): this {
    this.config.speaking_rate = Math.max(0.5, Math.min(2.0, rate));
    return this;
  }

  setPitch(pitch: number): this {
    this.config.pitch = Math.max(-20, Math.min(20, pitch));
    return this;
  }

  setVolume(volumeDb: number): this {
    this.config.volume_gain_db = Math.max(-20, Math.min(20, volumeDb));
    return this;
  }

  setEmotion(type: string, intensity: number): this {
    this.config.emotion = {
      type: type as any,
      intensity: Math.max(0, Math.min(1, intensity))
    };
    return this;
  }

  setPauses(sentencePause: number, commaPause: number, periodPause: number): this {
    if (this.config.breathing) {
      this.config.breathing.pause_between_sentences = sentencePause;
      this.config.breathing.pause_after_comma = commaPause;
      this.config.breathing.pause_after_period = periodPause;
    }
    return this;
  }

  enablePostProcessing(options: Partial<AdvancedTTSConfig['post_processing']>): this {
    this.config.post_processing = {
      normalize_volume: this.config.post_processing?.normalize_volume ?? true,
      remove_silence: this.config.post_processing?.remove_silence ?? false,
      enhance_clarity: this.config.post_processing?.enhance_clarity ?? true,
      compress_dynamic_range: this.config.post_processing?.compress_dynamic_range ?? false,
      ...options
    };
    return this;
  }

  build(): Partial<AdvancedTTSConfig> {
    return this.config;
  }

  // 자동차 정비 영상용 최적화 설정
  static createAutoRepairConfig(): Partial<AdvancedTTSConfig> {
    return new TTSConfigBuilder('auto_repair_narration')
      .setSpeakingRate(0.92)
      .setPitch(-2)
      .setVolume(2)
      .setEmotion('professional', 0.6)
      .setPauses(800, 300, 1000)
      .enablePostProcessing({
        normalize_volume: true,
        enhance_clarity: true,
        compress_dynamic_range: true
      })
      .build();
  }
}