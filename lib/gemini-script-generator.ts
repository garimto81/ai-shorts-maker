// Gemini AI 기반 스크립트 생성 엔진

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';
import { scriptDatabase, SampleScript, ScriptTemplate } from './script-database';

export interface ScriptGenerationRequest {
  topic: string;
  category: string;
  targetDuration: number; // 초 단위
  style?: 'formal' | 'casual' | 'energetic' | 'calm' | 'educational';
  audience?: 'general' | 'teens' | 'adults' | 'professionals' | 'seniors';
  sampleScriptIds?: string[]; // 참조할 샘플 스크립트 ID들
  templateId?: string;
  customPrompts?: {
    tone?: string;
    style?: string;
    content?: string;
  };
  imageAnalysis?: {
    scenes: string[];
    visualElements: string[];
    storyFlow: string;
  };
}

export interface GeneratedScript {
  id: string;
  title: string;
  content: {
    narration: string;
    scenes: GeneratedScene[];
    timing: {
      totalDuration: number;
      sections: SectionTiming[];
    };
  };
  metadata: {
    generatedAt: Date;
    basedOnSamples: string[];
    templateUsed?: string;
    aiConfidence: number;
    estimatedQuality: number;
  };
  suggestions: {
    improvements: string[];
    alternatives: string[];
    visualTips: string[];
  };
}

export interface GeneratedScene {
  sequence: number;
  description: string;
  narration: string;
  duration: number;
  visualInstructions: string[];
  transitionSuggestion?: string;
}

export interface SectionTiming {
  name: string;
  startTime: number;
  duration: number;
  description: string;
}

export class GeminiScriptGenerator {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  
  /**
   * 메인 스크립트 생성 함수
   */
  async generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
    console.log(`🎬 스크립트 생성 시작: ${request.topic}`);
    
    try {
      // 1. 참조 샘플 스크립트 로드
      const sampleScripts = await this.loadSampleScripts(request.sampleScriptIds);
      
      // 2. 템플릿 로드
      const template = request.templateId ? 
        await scriptDatabase.getTemplateById(request.templateId) : null;
      
      // 3. AI 프롬프트 구성
      const prompt = this.buildGenerationPrompt(request, sampleScripts, template);
      
      // 4. Gemini AI 호출
      const aiResponse = await this.callGeminiAPI(prompt);
      
      // 5. 응답 파싱 및 구조화
      const generatedScript = this.parseAIResponse(aiResponse, request, sampleScripts);
      
      // 6. 품질 검증 및 개선 제안
      const validatedScript = await this.validateAndImprove(generatedScript, request);
      
      // 7. 사용 통계 업데이트
      await this.updateUsageStats(request.sampleScriptIds);
      
      console.log(`✅ 스크립트 생성 완료: ${validatedScript.title}`);
      return validatedScript;
      
    } catch (error) {
      console.error('스크립트 생성 실패:', error);
      throw new Error(`스크립트 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 샘플 스크립트들을 로드
   */
  private async loadSampleScripts(sampleIds?: string[]): Promise<SampleScript[]> {
    if (!sampleIds || sampleIds.length === 0) {
      return [];
    }
    
    const scripts: SampleScript[] = [];
    for (const id of sampleIds) {
      const script = await scriptDatabase.getScriptById(id);
      if (script) {
        scripts.push(script);
      }
    }
    
    return scripts;
  }
  
  /**
   * Gemini AI용 프롬프트 구성
   */
  private buildGenerationPrompt(
    request: ScriptGenerationRequest,
    sampleScripts: SampleScript[],
    template?: ScriptTemplate | null
  ): string {
    let prompt = `당신은 전문 영상 스크립트 작가입니다. 다음 요구사항에 맞는 ${request.targetDuration}초 분량의 영상 스크립트를 작성해주세요.

📋 기본 요구사항:
- 주제: ${request.topic}
- 카테고리: ${request.category}
- 목표 길이: ${request.targetDuration}초
- 스타일: ${request.style || '자연스럽고 매력적인'}
- 대상 관객: ${request.audience || '일반 시청자'}

`;

    // 샘플 스크립트 분석 추가
    if (sampleScripts.length > 0) {
      prompt += `🎯 참조할 샘플 스크립트들:
다음 샘플 스크립트들의 톤, 구조, 스타일을 참고하여 작성해주세요:

`;
      
      sampleScripts.forEach((sample, index) => {
        prompt += `${index + 1}. "${sample.title}" (${sample.category})
   톤: ${sample.aiPrompts.tonePrompt}
   구조: ${sample.aiPrompts.structurePrompt}
   스타일: ${sample.aiPrompts.stylePrompt}
   
   내용 예시:
   ${sample.content.narration.substring(0, 200)}...
   
`;
      });
    }
    
    // 템플릿 구조 추가
    if (template) {
      prompt += `📐 템플릿 구조 (${template.name}):
${template.description}

구조 요구사항:
`;
      
      template.structure.sections.forEach(section => {
        prompt += `- ${section.name} (${section.minDuration}-${section.maxDuration}초): ${section.description}
  AI 가이드: ${section.aiPrompt}
`;
      });
      
      prompt += `
콘텐츠 가이드라인:
${template.aiGuidelines.contentGuidelines.map(g => `- ${g}`).join('\n')}

스타일 가이드라인:
${template.aiGuidelines.styleGuidelines.map(g => `- ${g}`).join('\n')}

길이 가이드라인:
${template.aiGuidelines.lengthGuidelines.map(g => `- ${g}`).join('\n')}

`;
    }
    
    // 이미지 분석 정보 추가
    if (request.imageAnalysis) {
      prompt += `🖼️ 이미지 분석 결과:
감지된 장면들: ${request.imageAnalysis.scenes.join(', ')}
시각적 요소들: ${request.imageAnalysis.visualElements.join(', ')}
스토리 흐름: ${request.imageAnalysis.storyFlow}

`;
    }
    
    // 커스텀 프롬프트 추가
    if (request.customPrompts) {
      prompt += `🎨 추가 요구사항:
`;
      if (request.customPrompts.tone) {
        prompt += `톤: ${request.customPrompts.tone}\n`;
      }
      if (request.customPrompts.style) {
        prompt += `스타일: ${request.customPrompts.style}\n`;
      }
      if (request.customPrompts.content) {
        prompt += `내용: ${request.customPrompts.content}\n`;
      }
    }
    
    prompt += `
📝 출력 형식:
다음 JSON 형식으로 응답해주세요:

{
  "title": "영상 제목",
  "narration": "전체 나레이션 텍스트",
  "scenes": [
    {
      "sequence": 1,
      "description": "장면 설명",
      "narration": "이 장면의 나레이션",
      "duration": 10,
      "visualInstructions": ["시각적 지시사항1", "시각적 지시사항2"],
      "transitionSuggestion": "다음 장면으로의 전환 방식"
    }
  ],
  "timing": {
    "totalDuration": ${request.targetDuration},
    "sections": [
      {
        "name": "도입부",
        "startTime": 0,
        "duration": 8,
        "description": "섹션 설명"
      }
    ]
  },
  "confidence": 0.9,
  "suggestions": {
    "improvements": ["개선 제안1", "개선 제안2"],
    "alternatives": ["대안 아이디어1", "대안 아이디어2"],
    "visualTips": ["시각적 팁1", "시각적 팁2"]
  }
}

💡 중요사항:
1. 나레이션은 자연스럽고 매력적으로 작성
2. 각 장면의 시각적 지시사항을 구체적으로 제공
3. 전체 구성이 ${request.targetDuration}초에 맞도록 조절
4. 샘플 스크립트의 장점을 적극 활용
5. 대상 관객을 고려한 톤과 내용 선택
6. 한국어로 자연스럽게 작성

`;

    return prompt;
  }
  
  /**
   * Gemini AI API 호출
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
  
  /**
   * AI 응답 파싱 및 구조화
   */
  private parseAIResponse(
    aiResponse: string, 
    request: ScriptGenerationRequest,
    sampleScripts: SampleScript[]
  ): GeneratedScript {
    try {
      // JSON 응답에서 코드 블록 제거
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        id: this.generateId(),
        title: parsed.title || `${request.topic} 스크립트`,
        content: {
          narration: parsed.narration || '',
          scenes: parsed.scenes || [],
          timing: {
            totalDuration: parsed.timing?.totalDuration || request.targetDuration,
            sections: parsed.timing?.sections || []
          }
        },
        metadata: {
          generatedAt: new Date(),
          basedOnSamples: sampleScripts.map(s => s.id),
          templateUsed: request.templateId,
          aiConfidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
          estimatedQuality: this.estimateQuality(parsed, request)
        },
        suggestions: {
          improvements: parsed.suggestions?.improvements || [],
          alternatives: parsed.suggestions?.alternatives || [],
          visualTips: parsed.suggestions?.visualTips || []
        }
      };
      
    } catch (error) {
      console.error('AI 응답 파싱 실패:', error);
      
      // 파싱 실패 시 기본 구조로 대체
      return this.createFallbackScript(request, sampleScripts);
    }
  }
  
  /**
   * 품질 검증 및 개선 제안
   */
  private async validateAndImprove(
    script: GeneratedScript, 
    request: ScriptGenerationRequest
  ): Promise<GeneratedScript> {
    const issues: string[] = [];
    const improvements: string[] = [...script.suggestions.improvements];
    
    // 길이 검증
    const actualDuration = script.content.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const targetDuration = request.targetDuration;
    const tolerance = targetDuration * 0.1; // 10% 허용 오차
    
    if (Math.abs(actualDuration - targetDuration) > tolerance) {
      issues.push(`목표 길이(${targetDuration}초)와 실제 길이(${actualDuration}초) 차이가 큽니다.`);
      improvements.push('장면별 시간 배분을 조정하여 목표 길이에 맞춰주세요.');
    }
    
    // 장면 수 검증
    if (script.content.scenes.length < 2) {
      issues.push('장면이 너무 적습니다.');
      improvements.push('2-5개의 장면으로 구성하여 시각적 다양성을 높여주세요.');
    }
    
    // 나레이션 길이 검증
    const narrationLength = script.content.narration.length;
    const expectedLength = targetDuration * 15; // 초당 약 15자 기준
    
    if (narrationLength < expectedLength * 0.7 || narrationLength > expectedLength * 1.3) {
      issues.push('나레이션 길이가 목표 시간에 비해 적절하지 않습니다.');
      improvements.push('읽기 속도를 고려하여 나레이션 길이를 조정해주세요.');
    }
    
    // 품질 점수 재계산
    const qualityPenalty = issues.length * 0.1;
    const adjustedQuality = Math.max(0.3, script.metadata.estimatedQuality - qualityPenalty);
    
    return {
      ...script,
      metadata: {
        ...script.metadata,
        estimatedQuality: adjustedQuality
      },
      suggestions: {
        ...script.suggestions,
        improvements: improvements
      }
    };
  }
  
  /**
   * 품질 추정
   */
  private estimateQuality(parsed: any, request: ScriptGenerationRequest): number {
    let score = 0.5; // 기본 점수
    
    // 구조 완성도
    if (parsed.title && parsed.narration && parsed.scenes) score += 0.2;
    if (parsed.scenes && parsed.scenes.length >= 2) score += 0.1;
    if (parsed.timing && parsed.timing.sections) score += 0.1;
    
    // 내용 풍부함
    if (parsed.narration && parsed.narration.length > 100) score += 0.1;
    if (parsed.suggestions && Object.keys(parsed.suggestions).length > 0) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  /**
   * 사용 통계 업데이트
   */
  private async updateUsageStats(sampleIds?: string[]): Promise<void> {
    if (!sampleIds) return;
    
    for (const id of sampleIds) {
      await scriptDatabase.incrementUsage(id);
    }
  }
  
  /**
   * 폴백 스크립트 생성
   */
  private createFallbackScript(
    request: ScriptGenerationRequest,
    sampleScripts: SampleScript[]
  ): GeneratedScript {
    return {
      id: this.generateId(),
      title: `${request.topic} - 자동 생성 스크립트`,
      content: {
        narration: `${request.topic}에 대한 흥미로운 이야기를 시작해보겠습니다...`,
        scenes: [
          {
            sequence: 1,
            description: '도입부 장면',
            narration: '오늘 다룰 주제를 소개하며 시청자의 관심을 끕니다.',
            duration: Math.floor(request.targetDuration * 0.3),
            visualInstructions: ['제목 텍스트 표시', '매력적인 배경'],
            transitionSuggestion: 'fade'
          },
          {
            sequence: 2,
            description: '본문 장면',
            narration: '핵심 내용을 자세히 설명합니다.',
            duration: Math.floor(request.targetDuration * 0.5),
            visualInstructions: ['관련 이미지 표시', '핵심 포인트 강조'],
            transitionSuggestion: 'cut'
          },
          {
            sequence: 3,
            description: '마무리 장면',
            narration: '내용을 요약하고 마무리합니다.',
            duration: Math.floor(request.targetDuration * 0.2),
            visualInstructions: ['요약 텍스트', '마무리 화면'],
            transitionSuggestion: 'fade'
          }
        ],
        timing: {
          totalDuration: request.targetDuration,
          sections: [
            { name: '도입', startTime: 0, duration: Math.floor(request.targetDuration * 0.3), description: '주제 소개' },
            { name: '본문', startTime: Math.floor(request.targetDuration * 0.3), duration: Math.floor(request.targetDuration * 0.5), description: '핵심 내용' },
            { name: '마무리', startTime: Math.floor(request.targetDuration * 0.8), duration: Math.floor(request.targetDuration * 0.2), description: '요약 및 마무리' }
          ]
        }
      },
      metadata: {
        generatedAt: new Date(),
        basedOnSamples: sampleScripts.map(s => s.id),
        templateUsed: request.templateId,
        aiConfidence: 0.5,
        estimatedQuality: 0.6
      },
      suggestions: {
        improvements: ['AI 응답 파싱 실패로 인한 기본 스크립트입니다. 다시 생성해보세요.'],
        alternatives: ['다른 샘플 스크립트를 참조해보세요.'],
        visualTips: ['이미지와 텍스트를 적절히 조합하세요.']
      }
    };
  }
  
  private generateId(): string {
    return 'script_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const geminiScriptGenerator = new GeminiScriptGenerator();