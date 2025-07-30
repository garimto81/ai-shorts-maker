// 향상된 Gemini TTS 엔진 - 자연스러운 음성 생성을 위한 통합 시스템

import { GeminiTTSEngine, TTSRequest, TTSResult } from './gemini-tts';
import { TTSTextPreprocessor } from './tts-text-preprocessor';
import { SSMLBuilder } from './ssml-builder';
import { AdvancedTTSConfig, TTSPresets, VideoTypePresets, TTSConfigBuilder } from './advanced-tts-config';

export interface EnhancedTTSRequest extends TTSRequest {
  preset?: keyof typeof TTSPresets;
  videoType?: 'auto_repair' | 'tutorial' | 'story' | 'advertisement' | 'educational' | 'news' | 'documentary';
  customConfig?: Partial<AdvancedTTSConfig>;
  keywords?: string[];  // 강조할 키워드
  formalTone?: boolean; // 격식체 변환 여부
}

export interface EnhancedTTSResult extends TTSResult {
  preprocessedText?: string;  // 전처리된 텍스트
  ssmlText?: string;         // 생성된 SSML
  configUsed?: Partial<AdvancedTTSConfig>; // 사용된 설정
}

export class EnhancedGeminiTTS extends GeminiTTSEngine {
  private preprocessor = new TTSTextPreprocessor();

  /**
   * 자연스러운 음성 생성 - 메인 메서드
   */
  async generateNaturalSpeech(
    text: string,
    options: EnhancedTTSRequest = {}
  ): Promise<EnhancedTTSResult> {
    console.log('🎙️ 향상된 TTS 생성 시작');
    
    try {
      // 1. 설정 결정 (프리셋 또는 커스텀)
      const config = this.determineConfig(options);
      console.log('⚙️ TTS 설정:', {
        preset: options.preset || options.videoType || 'default',
        emotion: config.emotion?.type,
        speed: config.speaking_rate
      });

      // 2. 텍스트 전처리
      const preprocessedText = this.preprocessor.preprocessText(text, {
        emotion: config.emotion?.type,
        keywords: options.keywords,
        convertNumbers: true,
        convertEnglish: true,
        addPauses: false, // SSML에서 처리
        formalTone: options.formalTone
      });
      console.log('📝 텍스트 전처리 완료');

      // 3. SSML 생성
      const ssmlText = this.buildSSML(preprocessedText, config);
      console.log('🏗️ SSML 생성 완료');

      // 4. 기본 TTS 엔진 호출
      const baseRequest: TTSRequest = {
        text: ssmlText,
        voice: options.voice || this.selectVoiceForLanguage(options.language),
        speed: this.mapSpeedToBase(config.speaking_rate || 1.0),
        style: this.mapEmotionToStyle(config.emotion?.type),
        language: options.language || 'ko'
      };

      const result = await super.textToSpeech(baseRequest);

      // 5. 향상된 결과 반환
      return {
        ...result,
        preprocessedText,
        ssmlText,
        configUsed: config
      } as EnhancedTTSResult;

    } catch (error: any) {
      console.error('❌ 향상된 TTS 생성 실패:', error);
      return {
        success: false,
        error: error.message || '향상된 TTS 생성 중 오류가 발생했습니다.',
        format: 'wav',
        sampleRate: 24000,
        channels: 1
      };
    }
  }

  /**
   * 영상 나레이션용 특화 메서드
   */
  async generateVideoNarration(
    script: string,
    videoType: 'auto_repair' | 'tutorial' | 'story' | 'advertisement' | 'educational' | 'news' | 'documentary',
    customOptions?: Partial<EnhancedTTSRequest>
  ): Promise<EnhancedTTSResult> {
    console.log(`🎬 ${videoType} 영상 나레이션 생성 시작`);

    // 영상 타입별 키워드 설정
    const keywordMap: Record<string, string[]> = {
      auto_repair: ['휠복원', '휠수리', 'CNC', '샌드블라스터', '클리어코트', '신차급', '완벽'],
      tutorial: ['단계', '먼저', '다음', '마지막', '중요', '주의'],
      story: ['오늘', '그리고', '하지만', '결국', '마침내'],
      advertisement: ['최고', '특별', '놀라운', '지금', '기회'],
      educational: ['학습', '이해', '개념', '예시', '정리'],
      news: ['발표', '보도', '확인', '전해', '소식'],
      documentary: ['역사', '발견', '연구', '과학', '사실']
    };

    const options: EnhancedTTSRequest = {
      videoType,
      keywords: keywordMap[videoType] || [],
      formalTone: ['news', 'documentary', 'educational'].includes(videoType),
      ...customOptions
    };

    return this.generateNaturalSpeech(script, options);
  }

  /**
   * 자동차 정비 영상용 최적화 메서드
   */
  async generateAutoRepairNarration(
    script: string,
    options?: Partial<EnhancedTTSRequest>
  ): Promise<EnhancedTTSResult> {
    console.log('🔧 자동차 정비 영상 나레이션 생성');

    // 자동차 정비 전용 전처리
    const preprocessedScript = this.preprocessor.preprocessAutoRepairScript(script);

    // 자동차 정비 전용 설정
    const autoRepairOptions: EnhancedTTSRequest = {
      preset: 'auto_repair_narration',
      keywords: [
        '휠복원', '휠수리', '샌드블라스터', 'CNC', '클리어코트',
        '휠굴절', '휠크랙', '분체도색', '유분제거', '신차급',
        '완벽', '만족', '고품질', '전문가', '숙련'
      ],
      formalTone: true,
      ...options
    };

    return this.generateNaturalSpeech(preprocessedScript, autoRepairOptions);
  }

  /**
   * 설정 결정 로직
   */
  private determineConfig(options: EnhancedTTSRequest): Partial<AdvancedTTSConfig> {
    // 1. 커스텀 설정이 있으면 우선 사용
    if (options.customConfig) {
      return options.customConfig;
    }

    // 2. 프리셋이 지정되었으면 사용
    if (options.preset && TTSPresets[options.preset]) {
      return TTSPresets[options.preset];
    }

    // 3. 비디오 타입이 지정되었으면 해당 프리셋 사용
    if (options.videoType) {
      const presetName = VideoTypePresets[options.videoType];
      if (presetName && TTSPresets[presetName]) {
        return TTSPresets[presetName];
      }
    }

    // 4. 기본 설정 사용
    return TTSPresets.narration;
  }

  /**
   * SSML 생성
   */
  private buildSSML(text: string, config: Partial<AdvancedTTSConfig>): string {
    const builder = new SSMLBuilder();
    
    // 텍스트를 문장 단위로 분리
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      // 문장 타입 감지
      const isQuestion = trimmed.endsWith('?');
      const isExclamation = trimmed.endsWith('!');
      const isLastSentence = index === sentences.length - 1;

      // 문장별 설정 조정
      let sentenceSpeed = config.speaking_rate ? config.speaking_rate * 100 : 100;
      let sentencePitch = config.pitch || 0;
      let sentenceVolume = config.volume_gain_db || 0;

      // 질문은 끝을 올려서
      if (isQuestion) {
        sentencePitch += 5;
      }

      // 감탄문은 강조
      if (isExclamation) {
        sentenceVolume += 2;
        sentenceSpeed += 5;
      }

      // 마지막 문장은 천천히
      if (isLastSentence) {
        sentenceSpeed -= 5;
      }

      // 문장 추가
      builder.addSentence(trimmed, {
        speed: sentenceSpeed,
        pitch: sentencePitch,
        volume: sentenceVolume
      });

      // 문장 사이 일시정지
      if (!isLastSentence) {
        const pauseDuration = isQuestion || isExclamation
          ? config.breathing?.pause_after_period || 800
          : config.breathing?.pause_between_sentences || 600;
        
        builder.addPause(pauseDuration);
      }
    });

    return builder.build();
  }

  /**
   * 속도 매핑 (고급 설정 → 기본 설정)
   */
  private mapSpeedToBase(rate: number): 'slow' | 'normal' | 'fast' {
    if (rate < 0.85) return 'slow';
    if (rate > 1.15) return 'fast';
    return 'normal';
  }

  /**
   * 감정 매핑 (고급 설정 → 기본 설정)
   */
  private mapEmotionToStyle(emotion?: string): 'neutral' | 'cheerful' | 'calm' | 'excited' | 'professional' {
    const emotionMap: Record<string, any> = {
      'happy': 'cheerful',
      'sad': 'calm',
      'angry': 'excited',
      'fearful': 'excited',
      'professional': 'professional',
      'neutral': 'neutral'
    };

    return emotionMap[emotion || 'neutral'] || 'neutral';
  }

  /**
   * 언어별 기본 음성 선택
   */
  private selectVoiceForLanguage(language?: string): string {
    const voiceMap: Record<string, string> = {
      'ko': 'Kore',
      'en': 'Aoede',
      'ja': 'Kore',  // 일본어도 Kore 사용
      'zh': 'Kore'   // 중국어도 Kore 사용
    };

    return voiceMap[language || 'ko'] || 'Kore';
  }

  /**
   * 샘플 스크립트로 테스트
   */
  async testWithSampleScript(): Promise<void> {
    const sampleScript = `
    오늘 입고된 차는 BMW X5 차량입니다.
    1억이 넘어가는 고가의 차량이 휠 기스로 인해서 들어오는 모습이 상당히 가슴이 아팠습니다.
    
    일단 유분 제거를 철저히 해주고, 세척과 샌딩 후 전용 컷팅을 해서 작업을 했더니
    다시금 신차급 퍼포먼스를 보여줍니다.
    
    작업자로써 너무 만족하게 출고 드렸습니다.
    `;

    console.log('🧪 샘플 스크립트 테스트 시작');
    
    const result = await this.generateAutoRepairNarration(sampleScript);
    
    if (result.success) {
      console.log('✅ 테스트 성공!');
      console.log('- 오디오 경로:', result.audioPath);
      console.log('- 재생 시간:', result.duration, '초');
      console.log('- SSML 미리보기:', result.ssmlText?.substring(0, 200) + '...');
    } else {
      console.error('❌ 테스트 실패:', result.error);
    }
  }
}

// 싱글톤 인스턴스 생성
export const enhancedTTS = new EnhancedGeminiTTS();