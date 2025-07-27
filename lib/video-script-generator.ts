// 영상화를 위한 스크립트 제작 로직 (v1.7.0)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';
import { SampleScript } from './script-database';

export interface VideoScriptRequest {
  baseScript: SampleScript;
  narrationSpeed: 'slow' | 'normal' | 'fast'; // 나레이션 속도
  images?: ImageAnalysis[]; // 업로드된 이미지들
  videoStyle: 'educational' | 'entertainment' | 'promotional' | 'documentary';
}

export interface ImageAnalysis {
  filename: string;
  description: string;
  suggestedDuration: number;
  visualElements: string[];
  emotionalTone: string;
  usageRecommendation: string;
}

export interface VideoScriptResult {
  // 기본 정보
  title: string;
  description: string;
  totalDuration: number;
  
  // 나레이션 정보
  narration: {
    fullText: string;
    estimatedSpeechDuration: number;
    wordsPerMinute: number;
    segments: NarrationSegment[];
  };
  
  // 영상 구성
  scenes: VideoScene[];
  
  // 타이밍 정보
  timing: {
    totalDuration: number;
    introLength: number;
    mainLength: number;
    outroLength: number;
    transitionDurations: number[];
  };
  
  // 제작 가이드
  productionGuide: {
    imageRequirements: ImageRequirement[];
    transitionEffects: string[];
    backgroundMusic: string;
    overlayText: OverlayText[];
  };
}

export interface NarrationSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  pace: 'slow' | 'normal' | 'fast';
  emphasis: string[];
}

export interface VideoScene {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  narrationSegments: string[]; // NarrationSegment IDs
  visualElements: VisualElement[];
  transitions: SceneTransition;
}

export interface VisualElement {
  type: 'image' | 'text' | 'graphic' | 'animation';
  content: string;
  position: 'fullscreen' | 'overlay' | 'split' | 'corner';
  timing: { start: number; end: number };
  animation?: string;
}

export interface SceneTransition {
  type: 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';
  duration: number;
}

export interface ImageRequirement {
  sceneId: string;
  description: string;
  style: string;
  resolution: string;
  duration: number;
  purpose: string;
}

export interface OverlayText {
  text: string;
  startTime: number;
  endTime: number;
  style: string;
  position: string;
}

export class VideoScriptGenerator {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  /**
   * 영상화를 위한 스크립트 생성
   */
  async generateVideoScript(request: VideoScriptRequest): Promise<VideoScriptResult> {
    console.log('영상 스크립트 생성 시작:', {
      title: request.baseScript.title,
      narrationSpeed: request.narrationSpeed,
      imageCount: request.images?.length || 0
    });

    // 1. 최적 영상 길이 자동 계산
    const optimalDuration = this.calculateOptimalDuration(
      request.baseScript,
      request.images || [],
      request.narrationSpeed
    );

    console.log('계산된 최적 영상 길이:', optimalDuration + '초');

    // 2. 나레이션 분석 및 조정
    const narrationAnalysis = await this.analyzeNarration(
      request.baseScript.content.narration,
      optimalDuration,
      request.narrationSpeed
    );

    // 3. 이미지 분석 (제공된 경우)
    const imageAnalysis = request.images ? 
      await this.analyzeImages(request.images, request.baseScript) : [];

    // 4. 영상 구성 계획
    const videoStructure = await this.planVideoStructure(
      request.baseScript,
      narrationAnalysis,
      imageAnalysis,
      optimalDuration,
      request.videoStyle
    );

    // 5. 장면별 세부 계획
    const detailedScenes = await this.createDetailedScenes(
      videoStructure,
      narrationAnalysis,
      imageAnalysis,
      request.videoStyle
    );

    // 6. 제작 가이드 생성
    const productionGuide = await this.generateProductionGuide(
      detailedScenes,
      request.videoStyle,
      optimalDuration
    );

    return {
      title: this.optimizeTitle(request.baseScript.title, request.videoStyle),
      description: this.optimizeDescription(request.baseScript.description, request.videoStyle),
      totalDuration: optimalDuration,
      narration: narrationAnalysis,
      scenes: detailedScenes,
      timing: this.calculateTiming(detailedScenes),
      productionGuide
    };
  }

  /**
   * 최적 영상 길이 자동 계산
   */
  private calculateOptimalDuration(
    baseScript: SampleScript,
    images: ImageAnalysis[],
    narrationSpeed: 'slow' | 'normal' | 'fast'
  ): number {
    // 1. 나레이션 기반 최소 시간 계산
    const narrationLength = baseScript.content.narration.length;
    const wpmSettings = { slow: 120, normal: 160, fast: 200 };
    const targetWPM = wpmSettings[narrationSpeed];
    
    // 한국어는 음절 기준으로 계산 (영어 단어와 다름)
    const estimatedSyllables = narrationLength * 0.7; // 대략적인 음절 수
    const baseNarrationTime = (estimatedSyllables / targetWPM) * 60;
    
    console.log('나레이션 기반 계산:', {
      length: narrationLength,
      estimatedSyllables,
      baseTime: baseNarrationTime
    });

    // 2. 이미지 기반 추가 시간 계산
    const imageTime = images.length * 3; // 이미지당 평균 3초
    
    // 3. 장면 기반 최소 시간 (기존 장면 구성 고려)
    const sceneCount = baseScript.content.scenes?.length || 3;
    const minSceneTime = sceneCount * 4; // 장면당 최소 4초
    
    // 4. 콘텐츠 복잡도 기반 가중치
    const contentComplexity = this.calculateContentComplexity(baseScript);
    const complexityMultiplier = 1 + (contentComplexity * 0.3); // 최대 30% 증가
    
    console.log('복잡도 계산:', {
      complexity: contentComplexity,
      multiplier: complexityMultiplier
    });

    // 5. 여러 요소 중 최대값을 기본으로 하되, 가중치 적용
    const baseDuration = Math.max(
      baseNarrationTime + 5, // 나레이션 + 여유시간
      imageTime + 10,       // 이미지 + 여유시간
      minSceneTime          // 최소 장면 시간
    );
    
    const adjustedDuration = baseDuration * complexityMultiplier;
    
    // 6. 최종 제한 적용 (15초 ~ 60초)
    const finalDuration = Math.max(15, Math.min(60, Math.round(adjustedDuration)));
    
    console.log('길이 계산 세부사항:', {
      baseNarrationTime: Math.round(baseNarrationTime),
      imageTime,
      minSceneTime,
      baseDuration: Math.round(baseDuration),
      adjustedDuration: Math.round(adjustedDuration),
      finalDuration
    });
    
    return finalDuration;
  }

  /**
   * 콘텐츠 복잡도 계산 (0.0 ~ 1.0)
   */
  private calculateContentComplexity(baseScript: SampleScript): number {
    let complexity = 0;
    
    // 나레이션 길이 기반 (긴 텍스트 = 더 복잡)
    const narrationLength = baseScript.content.narration.length;
    const lengthScore = Math.min(1, narrationLength / 500); // 500자를 기준으로 정규화
    complexity += lengthScore * 0.3;
    
    // 장면 수 기반 (많은 장면 = 더 복잡)
    const sceneCount = baseScript.content.scenes?.length || 1;
    const sceneScore = Math.min(1, sceneCount / 8); // 8장면을 기준으로 정규화
    complexity += sceneScore * 0.2;
    
    // 카테고리 기반 복잡도
    const categoryComplexity = {
      'tutorial': 0.8,      // 튜토리얼은 설명이 많아 복잡
      'educational': 0.7,   // 교육용도 복잡
      'documentary': 0.6,   // 다큐멘터리는 중간
      'review': 0.5,        // 리뷰는 비교적 단순
      'story': 0.4,         // 스토리는 단순
      'entertainment': 0.3, // 엔터테인먼트는 단순
      'promotional': 0.2,   // 홍보는 간단
      'news': 0.4,          // 뉴스는 중간
      'interview': 0.5,     // 인터뷰는 중간
      'comparison': 0.6     // 비교분석은 복잡
    };
    complexity += (categoryComplexity[baseScript.category as keyof typeof categoryComplexity] || 0.5) * 0.3;
    
    // 태그 수 기반 (많은 태그 = 더 다양한 내용)
    const tagCount = baseScript.tags?.length || 0;
    const tagScore = Math.min(1, tagCount / 10); // 10개 태그를 기준으로 정규화
    complexity += tagScore * 0.2;
    
    return Math.min(1, complexity);
  }

  /**
   * 나레이션 분석 및 속도 조정
   */
  private async analyzeNarration(
    originalText: string,
    targetDuration: number,
    speed: 'slow' | 'normal' | 'fast'
  ): Promise<VideoScriptResult['narration']> {
    
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // 속도에 따른 WPM (Words Per Minute) 설정
    const wpmSettings = {
      slow: 120,
      normal: 160,
      fast: 200
    };
    
    const targetWPM = wpmSettings[speed];
    const maxWords = Math.floor((targetDuration * targetWPM) / 60);
    
    const prompt = `
다음 나레이션을 영상용으로 최적화해주세요.

원본 나레이션:
"${originalText}"

요구사항:
- 목표 영상 길이: ${targetDuration}초
- 나레이션 속도: ${speed} (${targetWPM} WPM)
- 최대 단어 수: ${maxWords}개
- 자연스러운 호흡과 강조점 포함

다음 JSON 형식으로 응답해주세요:
{
  "optimizedText": "최적화된 나레이션 전문",
  "segments": [
    {
      "text": "세그먼트 텍스트",
      "duration": 예상_시간_초,
      "pace": "slow|normal|fast",
      "emphasis": ["강조할_단어들"]
    }
  ],
  "totalEstimatedDuration": 전체_예상_시간_초
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    try {
      const analysis = JSON.parse(this.extractJSON(analysisText));
      
      // 세그먼트에 타이밍 정보 추가
      let currentTime = 0;
      const segments: NarrationSegment[] = analysis.segments.map((seg: any, index: number) => {
        const startTime = currentTime;
        const endTime = currentTime + seg.duration;
        currentTime = endTime;
        
        return {
          id: `narration_${index + 1}`,
          text: seg.text,
          startTime,
          endTime,
          duration: seg.duration,
          pace: seg.pace || speed,
          emphasis: seg.emphasis || []
        };
      });

      return {
        fullText: analysis.optimizedText,
        estimatedSpeechDuration: analysis.totalEstimatedDuration,
        wordsPerMinute: targetWPM,
        segments
      };
      
    } catch (error) {
      console.error('나레이션 분석 파싱 오류:', error);
      
      // 폴백: 간단한 분할
      const words = originalText.split(' ');
      const segmentSize = Math.ceil(words.length / 4);
      const segments: NarrationSegment[] = [];
      
      for (let i = 0; i < 4; i++) {
        const segmentWords = words.slice(i * segmentSize, (i + 1) * segmentSize);
        const text = segmentWords.join(' ');
        const duration = (text.length / targetWPM) * 60 / 5; // 대략적 계산
        
        segments.push({
          id: `narration_${i + 1}`,
          text,
          startTime: i * (targetDuration / 4),
          endTime: (i + 1) * (targetDuration / 4),
          duration,
          pace: speed,
          emphasis: []
        });
      }
      
      return {
        fullText: originalText,
        estimatedSpeechDuration: targetDuration * 0.8, // 80% 나레이션
        wordsPerMinute: targetWPM,
        segments
      };
    }
  }

  /**
   * 이미지 분석
   */
  private async analyzeImages(
    images: ImageAnalysis[],
    baseScript: SampleScript
  ): Promise<ImageAnalysis[]> {
    
    if (!images.length) return [];
    
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const analysisPromises = images.map(async (image) => {
      const prompt = `
이미지를 영상 제작에 활용하기 위해 분석해주세요.

이미지 파일명: ${image.filename}
스크립트 제목: ${baseScript.title}
스크립트 카테고리: ${baseScript.category}

다음 JSON 형식으로 분석해주세요:
{
  "description": "이미지의 상세한 설명",
  "suggestedDuration": 화면에_표시할_권장_시간_초,
  "visualElements": ["주요_시각적_요소들"],
  "emotionalTone": "감정적_톤",
  "usageRecommendation": "영상에서의_활용_방법",
  "bestScenePosition": "intro|main|outro|transition"
}
`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();
        const analysis = JSON.parse(this.extractJSON(analysisText));
        
        return {
          ...image,
          ...analysis
        };
      } catch (error) {
        console.error(`이미지 분석 실패 (${image.filename}):`, error);
        return image; // 원본 반환
      }
    });
    
    return Promise.all(analysisPromises);
  }

  /**
   * 영상 구조 계획
   */
  private async planVideoStructure(
    baseScript: SampleScript,
    narrationAnalysis: VideoScriptResult['narration'],
    imageAnalysis: ImageAnalysis[],
    targetDuration: number,
    videoStyle: VideoScriptRequest['videoStyle']
  ): Promise<{ intro: number; main: number; outro: number; sceneCount: number }> {
    
    // 영상 스타일에 따른 구조 비율
    const structureRatios = {
      educational: { intro: 0.1, main: 0.8, outro: 0.1 },
      entertainment: { intro: 0.15, main: 0.7, outro: 0.15 },
      promotional: { intro: 0.2, main: 0.6, outro: 0.2 },
      documentary: { intro: 0.05, main: 0.9, outro: 0.05 }
    };
    
    const ratios = structureRatios[videoStyle];
    const sceneCount = Math.max(3, Math.min(8, Math.ceil(targetDuration / 10))); // 10초당 1장면
    
    return {
      intro: targetDuration * ratios.intro,
      main: targetDuration * ratios.main,
      outro: targetDuration * ratios.outro,
      sceneCount
    };
  }

  /**
   * 세부 장면 생성
   */
  private async createDetailedScenes(
    structure: { intro: number; main: number; outro: number; sceneCount: number },
    narrationAnalysis: VideoScriptResult['narration'],
    imageAnalysis: ImageAnalysis[],
    videoStyle: VideoScriptRequest['videoStyle']
  ): Promise<VideoScene[]> {
    
    const scenes: VideoScene[] = [];
    const mainSceneCount = structure.sceneCount - 2; // intro, outro 제외
    const mainSceneDuration = structure.main / mainSceneCount;
    
    let currentTime = 0;
    
    // 인트로 장면
    scenes.push({
      id: 'intro',
      title: '인트로',
      startTime: currentTime,
      endTime: currentTime + structure.intro,
      duration: structure.intro,
      narrationSegments: [narrationAnalysis.segments[0]?.id || ''].filter(Boolean),
      visualElements: this.createVisualElements('intro', structure.intro, imageAnalysis),
      transitions: { type: 'fade', duration: 0.5 }
    });
    
    currentTime += structure.intro;
    
    // 메인 장면들
    for (let i = 0; i < mainSceneCount; i++) {
      const sceneStart = currentTime;
      const sceneEnd = currentTime + mainSceneDuration;
      
      // 해당 시간대의 나레이션 세그먼트 찾기
      const relevantSegments = narrationAnalysis.segments.filter(seg => 
        seg.startTime >= sceneStart && seg.endTime <= sceneEnd
      );
      
      scenes.push({
        id: `main_${i + 1}`,
        title: `메인 장면 ${i + 1}`,
        startTime: sceneStart,
        endTime: sceneEnd,
        duration: mainSceneDuration,
        narrationSegments: relevantSegments.map(seg => seg.id),
        visualElements: this.createVisualElements('main', mainSceneDuration, imageAnalysis),
        transitions: { type: 'slide', duration: 0.3 }
      });
      
      currentTime += mainSceneDuration;
    }
    
    // 아웃트로 장면
    scenes.push({
      id: 'outro',
      title: '아웃트로',
      startTime: currentTime,
      endTime: currentTime + structure.outro,
      duration: structure.outro,
      narrationSegments: [narrationAnalysis.segments[narrationAnalysis.segments.length - 1]?.id || ''].filter(Boolean),
      visualElements: this.createVisualElements('outro', structure.outro, imageAnalysis),
      transitions: { type: 'fade', duration: 0.5 }
    });
    
    return scenes;
  }

  /**
   * 시각적 요소 생성
   */
  private createVisualElements(
    sceneType: 'intro' | 'main' | 'outro',
    duration: number,
    imageAnalysis: ImageAnalysis[]
  ): VisualElement[] {
    
    const elements: VisualElement[] = [];
    
    // 이미지 요소
    const relevantImages = imageAnalysis.filter(img => 
      img.usageRecommendation?.includes(sceneType) || sceneType === 'main'
    );
    
    if (relevantImages.length > 0) {
      const image = relevantImages[0];
      elements.push({
        type: 'image',
        content: image.filename,
        position: 'fullscreen',
        timing: { start: 0, end: duration },
        animation: sceneType === 'intro' ? 'fadeIn' : 'none'
      });
    }
    
    // 텍스트 오버레이
    if (sceneType === 'intro') {
      elements.push({
        type: 'text',
        content: '제목 표시',
        position: 'overlay',
        timing: { start: 0.5, end: duration - 0.5 },
        animation: 'slideUp'
      });
    }
    
    return elements;
  }

  /**
   * 제작 가이드 생성
   */
  private async generateProductionGuide(
    scenes: VideoScene[],
    videoStyle: VideoScriptRequest['videoStyle'],
    targetDuration: number
  ): Promise<VideoScriptResult['productionGuide']> {
    
    const imageRequirements: ImageRequirement[] = scenes.map(scene => ({
      sceneId: scene.id,
      description: `${scene.title}에 적합한 이미지`,
      style: this.getImageStyle(videoStyle),
      resolution: '1920x1080',
      duration: scene.duration,
      purpose: scene.id.includes('intro') ? '시선 집중' : scene.id.includes('outro') ? '마무리' : '내용 설명'
    }));
    
    const transitionEffects = this.getTransitionEffects(videoStyle);
    const backgroundMusic = this.getBackgroundMusic(videoStyle);
    
    const overlayText: OverlayText[] = [
      {
        text: '제목',
        startTime: 0,
        endTime: 3,
        style: 'title',
        position: 'center'
      }
    ];
    
    return {
      imageRequirements,
      transitionEffects,
      backgroundMusic,
      overlayText
    };
  }

  // 유틸리티 메서드들
  private optimizeTitle(originalTitle: string, style: VideoScriptRequest['videoStyle']): string {
    const prefixes = {
      educational: '[튜토리얼]',
      entertainment: '[재미있는]',
      promotional: '[홍보]',
      documentary: '[다큐멘터리]'
    };
    
    return `${prefixes[style]} ${originalTitle}`;
  }

  private optimizeDescription(originalDescription: string, style: VideoScriptRequest['videoStyle']): string {
    return `${originalDescription} (${style} 스타일로 제작된 영상입니다.)`;
  }

  private calculateTiming(scenes: VideoScene[]): VideoScriptResult['timing'] {
    const totalDuration = scenes[scenes.length - 1]?.endTime || 0;
    const introLength = scenes.find(s => s.id === 'intro')?.duration || 0;
    const outroLength = scenes.find(s => s.id === 'outro')?.duration || 0;
    const mainLength = totalDuration - introLength - outroLength;
    
    return {
      totalDuration,
      introLength,
      mainLength,
      outroLength,
      transitionDurations: scenes.map(s => s.transitions.duration)
    };
  }

  private getImageStyle(videoStyle: VideoScriptRequest['videoStyle']): string {
    const styles = {
      educational: '깔끔하고 전문적인',
      entertainment: '밝고 재미있는',
      promotional: '매력적이고 설득력 있는',
      documentary: '사실적이고 진지한'
    };
    return styles[videoStyle];
  }

  private getTransitionEffects(videoStyle: VideoScriptRequest['videoStyle']): string[] {
    const effects = {
      educational: ['fade', 'slide'],
      entertainment: ['zoom', 'bounce', 'flip'],
      promotional: ['wipe', 'star', 'zoom'],
      documentary: ['cut', 'fade']
    };
    return effects[videoStyle];
  }

  private getBackgroundMusic(videoStyle: VideoScriptRequest['videoStyle']): string {
    const music = {
      educational: '차분하고 집중할 수 있는 인스트루멘탈',
      entertainment: '경쾌하고 밝은 팝송',
      promotional: '에너지틱하고 임팩트 있는 음악',
      documentary: '감성적이고 서정적인 음악'
    };
    return music[videoStyle];
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }
}

// 싱글톤 인스턴스 생성
export const videoScriptGenerator = new VideoScriptGenerator();