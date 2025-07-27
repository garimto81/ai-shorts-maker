// 스크립트 자동 생성 기능 - 본문 기반 메타데이터 AI 추론 (v1.6.0)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';

export interface ScriptAutoGenerationRequest {
  content: string; // 본문만 입력
}

export interface ScriptAutoGenerationResult {
  // 자동 추론된 메타데이터
  title: string;
  description: string;
  category: string;
  tags: string[];
  
  // 원본 및 정제된 내용
  originalContent: string;
  refinedContent: {
    narration: string;
    scenes: SceneDescription[];
    timing: TimingInfo;
  };
  
  // AI 추론 정보
  aiAnalysis: {
    detectedTopic: string;
    businessType: string;
    targetAudience: string;
    tone: string;
    confidence: number;
  };
  
  // 메타데이터
  metadata: {
    estimatedDuration: number;
    difficultyLevel: string;
    requiredImages: number;
  };
}

interface SceneDescription {
  id: string;
  description: string;
  duration: number;
  visualHints: string[];
}

interface TimingInfo {
  totalDuration: number;
  sceneTimings: Array<{
    sceneId: string;
    startTime: number;
    endTime: number;
  }>;
}

export class ScriptAutoGenerator {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  /**
   * 본문 기반 스크립트 자동 생성
   */
  async generateFromContent(request: ScriptAutoGenerationRequest): Promise<ScriptAutoGenerationResult> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = this.createAnalysisPrompt(request.content);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    // AI 응답 파싱
    const analysis = this.parseAIResponse(analysisText);
    
    // 장면 분할 및 타이밍 생성
    const scenes = await this.generateScenes(request.content, analysis);
    const timing = this.calculateTiming(scenes);
    
    return {
      title: analysis.title,
      description: analysis.description,
      category: analysis.category,
      tags: analysis.tags,
      originalContent: Buffer.from(request.content, 'utf8').toString('utf8'),
      refinedContent: {
        narration: Buffer.from(this.refineNarration(request.content, analysis.tone), 'utf8').toString('utf8'),
        scenes: scenes,
        timing: timing
      },
      aiAnalysis: {
        detectedTopic: analysis.detectedTopic,
        businessType: analysis.businessType,
        targetAudience: analysis.targetAudience,
        tone: analysis.tone,
        confidence: analysis.confidence
      },
      metadata: {
        estimatedDuration: timing.totalDuration,
        difficultyLevel: this.assessDifficulty(scenes.length, analysis.businessType),
        requiredImages: scenes.length
      }
    };
  }

  /**
   * AI 분석 프롬프트 생성
   */
  private createAnalysisPrompt(content: string): string {
    return `
다음 본문을 분석하여 비디오 스크립트의 메타데이터를 추론해주세요:

본문:
"${content}"

다음 JSON 형식으로 응답해주세요:
{
  "title": "적절한 제목 (10-50자)",
  "description": "내용 요약 (50-200자)",
  "category": "카테고리 (튜토리얼/리뷰/스토리/뉴스/엔터테인먼트/교육/홍보/다큐멘터리/인터뷰/비교분석 중 하나)",
  "tags": ["관련", "태그", "목록"],
  "detectedTopic": "주요 주제",
  "businessType": "업종 (자동차정비/미용/요리/기술/의료/교육/리테일/서비스/제조/기타 중 하나)",
  "targetAudience": "대상 관객 (일반인/전문가/고객/학생/업계종사자 중 하나)",
  "tone": "톤 (친근한/전문적인/감정적인/정보전달/설득적인 중 하나)",
  "confidence": 0.95
}

분석 기준:
1. 업종과 서비스 유형을 정확히 파악
2. 전문 용어 사용도에 따른 대상 관객 추론
3. 문체와 표현에서 톤 파악
4. 내용의 복잡도와 전문성 수준 평가
5. SEO 최적화된 제목과 설명 생성
`;
  }

  /**
   * AI 응답 파싱
   */
  private parseAIResponse(response: string): any {
    try {
      // JSON 부분만 추출
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('유효한 JSON 응답을 찾을 수 없습니다');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI 응답 파싱 오류:', error);
      
      // 기본값 반환
      return {
        title: "자동 생성된 제목",
        description: "AI가 내용을 분석하여 생성한 설명입니다.",
        category: "튜토리얼",
        tags: ["작업", "과정", "결과"],
        detectedTopic: "작업 과정",
        businessType: "서비스",
        targetAudience: "일반인",
        tone: "친근한",
        confidence: 0.7
      };
    }
  }

  /**
   * 장면 분할 생성
   */
  private async generateScenes(content: string, analysis: any): Promise<SceneDescription[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
다음 내용을 비디오 장면들로 분할해주세요:

내용: "${content}"
업종: ${analysis.businessType}
톤: ${analysis.tone}

각 장면은 3-8초 정도의 길이로, 이미지 한 장과 짝이 되도록 분할해주세요.
JSON 배열 형식으로 응답:

[
  {
    "id": "scene_1",
    "description": "장면 설명",
    "duration": 5,
    "visualHints": ["시각적", "힌트", "목록"]
  }
]

분할 기준:
1. 자연스러운 내용 흐름 유지
2. 각 장면은 하나의 핵심 메시지
3. 시각적으로 구분 가능한 내용
4. 3-8초 적절한 길이
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const scenesText = response.text();
      
      const jsonMatch = scenesText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('장면 생성 오류:', error);
    }

    // 기본 장면 분할 (문장 단위)
    return this.createDefaultScenes(content);
  }

  /**
   * 기본 장면 분할 (백업)
   */
  private createDefaultScenes(content: string): SceneDescription[] {
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    return sentences.map((sentence, index) => ({
      id: `scene_${index + 1}`,
      description: sentence.trim(),
      duration: Math.max(3, Math.min(8, sentence.length / 10)),
      visualHints: this.extractVisualHints(sentence)
    }));
  }

  /**
   * 시각적 힌트 추출
   */
  private extractVisualHints(text: string): string[] {
    const hints = [];
    
    // 자동차 관련 키워드
    if (/차량|자동차|휠|타이어/i.test(text)) {
      hints.push('자동차', '차량');
    }
    
    // 작업 관련 키워드
    if (/작업|공정|처리/i.test(text)) {
      hints.push('작업장면', '과정');
    }
    
    // 결과 관련 키워드
    if (/완성|완료|결과|만족/i.test(text)) {
      hints.push('결과물', '완성품');
    }
    
    return hints.length > 0 ? hints : ['일반'];
  }

  /**
   * 타이밍 계산
   */
  private calculateTiming(scenes: SceneDescription[]): TimingInfo {
    let currentTime = 0;
    const sceneTimings = scenes.map(scene => {
      const startTime = currentTime;
      currentTime += scene.duration;
      return {
        sceneId: scene.id,
        startTime,
        endTime: currentTime
      };
    });

    return {
      totalDuration: currentTime,
      sceneTimings
    };
  }

  /**
   * 나레이션 정제
   */
  private refineNarration(content: string, tone: string): string {
    // 톤에 맞게 문체 조정
    switch (tone) {
      case '전문적인':
        return content.replace(/\s+/g, ' ').trim();
      case '친근한':
        return content.replace(/입니다/g, '이에요').replace(/습니다/g, '어요');
      default:
        return content.replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * 난이도 평가
   */
  private assessDifficulty(sceneCount: number, businessType: string): string {
    if (sceneCount <= 3) return '초급';
    if (sceneCount <= 6) return '중급';
    if (['의료', '기술', '제조'].includes(businessType)) return '고급';
    return '중급';
  }
}

// 싱글톤 인스턴스
export const scriptAutoGenerator = new ScriptAutoGenerator();