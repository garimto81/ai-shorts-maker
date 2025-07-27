// Gemini AI를 사용한 이미지 내용 분석 및 순서 결정 시스템

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';

export interface ImageAnalysisResult {
  filename: string;
  imageIndex: number;
  analysis: {
    scene: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    setting: string;
    people: string[];
    actions: string[];
    objects: string[];
    emotions: string[];
    temporalClues: string[];
  };
  sequenceHints: {
    isBeginning: number; // 0-1 확률
    isMiddle: number;
    isEnding: number;
    chronologicalOrder: number; // 추정 순서 (1-n)
  };
  confidence: number;
}

interface StoryFlow {
  arc: 'setup' | 'development' | 'climax' | 'resolution';
  position: number; // 0-1 (시작부터 끝까지)
  reasoning: string;
}

export class GeminiImageAnalyzer {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  /**
   * 단일 이미지 분석
   */
  public async analyzeImage(imageFile: any, index: number): Promise<ImageAnalysisResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision-latest" });
      
      // 이미지를 Base64로 변환
      const imageData = await this.fileToBase64(imageFile);
      
      const prompt = this.buildAnalysisPrompt();
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: imageFile.type || 'image/jpeg'
          }
        }
      ]);
      
      const response = await result.response;
      const analysisText = response.text();
      
      // Gemini 응답을 구조화된 데이터로 파싱
      const parsedAnalysis = this.parseGeminiResponse(analysisText);
      
      return {
        filename: imageFile.name,
        imageIndex: index,
        analysis: parsedAnalysis.analysis,
        sequenceHints: parsedAnalysis.sequenceHints,
        confidence: parsedAnalysis.confidence
      };
      
    } catch (error) {
      console.error(`이미지 분석 실패 (${imageFile.name}):`, error);
      
      // 실패 시 기본값 반환
      return this.getDefaultAnalysis(imageFile.name, index);
    }
  }

  /**
   * 이미지 분석을 위한 프롬프트 구성
   */
  private buildAnalysisPrompt(): string {
    return `
이미지를 분석하여 다음 정보를 JSON 형태로 제공해주세요:

1. 장면 설명 (scene): 이미지에서 일어나고 있는 일을 간단히 설명
2. 시간대 (timeOfDay): morning, afternoon, evening, night 중 하나
3. 배경/장소 (setting): 실내, 실외, 구체적 장소명
4. 등장인물 (people): 보이는 사람들의 특징
5. 행동 (actions): 진행 중인 행동들
6. 주요 객체 (objects): 중요한 물건들
7. 감정/분위기 (emotions): 전반적인 분위기
8. 시간적 단서 (temporalClues): 순서를 알 수 있는 단서들

순서 추정 (sequenceHints):
- isBeginning: 이야기의 시작 같은 느낌인지 (0-1)
- isMiddle: 중간 과정 같은 느낌인지 (0-1)  
- isEnding: 마무리 같은 느낌인지 (0-1)
- chronologicalOrder: 전체 스토리에서의 추정 순서 (1-10)

응답 형식:
{
  "analysis": {
    "scene": "설명",
    "timeOfDay": "morning|afternoon|evening|night",
    "setting": "장소",
    "people": ["인물1", "인물2"],
    "actions": ["행동1", "행동2"],
    "objects": ["객체1", "객체2"],
    "emotions": ["감정1", "감정2"],
    "temporalClues": ["단서1", "단서2"]
  },
  "sequenceHints": {
    "isBeginning": 0.8,
    "isMiddle": 0.2,
    "isEnding": 0.1,
    "chronologicalOrder": 2
  },
  "confidence": 0.85,
  "reasoning": "순서 판단 근거"
}

한국어로 분석해주세요.
`;
  }

  /**
   * Gemini 응답 파싱
   */
  private parseGeminiResponse(responseText: string): any {
    try {
      // JSON 응답에서 코드 블록 제거
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      
      // 기본값으로 보정
      return {
        analysis: {
          scene: parsed.analysis?.scene || '알 수 없음',
          timeOfDay: parsed.analysis?.timeOfDay || undefined,
          setting: parsed.analysis?.setting || '알 수 없음',
          people: parsed.analysis?.people || [],
          actions: parsed.analysis?.actions || [],
          objects: parsed.analysis?.objects || [],
          emotions: parsed.analysis?.emotions || [],
          temporalClues: parsed.analysis?.temporalClues || []
        },
        sequenceHints: {
          isBeginning: Math.max(0, Math.min(1, parsed.sequenceHints?.isBeginning || 0.5)),
          isMiddle: Math.max(0, Math.min(1, parsed.sequenceHints?.isMiddle || 0.5)),
          isEnding: Math.max(0, Math.min(1, parsed.sequenceHints?.isEnding || 0.5)),
          chronologicalOrder: Math.max(1, Math.min(10, parsed.sequenceHints?.chronologicalOrder || 5))
        },
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || '분석 근거 없음'
      };
      
    } catch (error) {
      console.error('Gemini 응답 파싱 실패:', error);
      return this.getDefaultParsedAnalysis();
    }
  }

  /**
   * 파일을 Base64로 변환 (브라우저 및 서버 환경 지원)
   */
  private async fileToBase64(file: any): Promise<string> {
    // 서버 환경 (Buffer가 있는 경우)
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      return file.buffer.toString('base64');
    }
    
    // 브라우저 환경 (File 객체)
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    throw new Error('파일을 Base64로 변환할 수 없습니다');
  }

  /**
   * 기본 분석 결과 생성
   */
  private getDefaultAnalysis(filename: string, index: number): ImageAnalysisResult {
    return {
      filename,
      imageIndex: index,
      analysis: {
        scene: '분석 실패',
        setting: '알 수 없음',
        people: [],
        actions: [],
        objects: [],
        emotions: [],
        temporalClues: []
      },
      sequenceHints: {
        isBeginning: 0.5,
        isMiddle: 0.5,
        isEnding: 0.5,
        chronologicalOrder: index + 1
      },
      confidence: 0.1
    };
  }

  private getDefaultParsedAnalysis(): any {
    return {
      analysis: {
        scene: '파싱 실패',
        setting: '알 수 없음',
        people: [],
        actions: [],
        objects: [],
        emotions: [],
        temporalClues: []
      },
      sequenceHints: {
        isBeginning: 0.5,
        isMiddle: 0.5,
        isEnding: 0.5,
        chronologicalOrder: 5
      },
      confidence: 0.3,
      reasoning: '응답 파싱 실패'
    };
  }

  /**
   * 여러 이미지 일괄 분석
   */
  public async analyzeBatch(imageFiles: any[]): Promise<ImageAnalysisResult[]> {
    console.log(`🔍 ${imageFiles.length}개 이미지 분석 시작...`);
    
    const batchSize = 3; // 동시 처리 개수 제한
    const results: ImageAnalysisResult[] = [];
    
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      
      console.log(`📸 배치 ${Math.floor(i/batchSize) + 1} 처리 중... (${i+1}-${Math.min(i+batchSize, imageFiles.length)})`);
      
      const batchPromises = batch.map((file, batchIndex) => 
        this.analyzeImage(file, i + batchIndex)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`이미지 ${i + batchIndex + 1} 분석 실패:`, result.reason);
          results.push(this.getDefaultAnalysis(batch[batchIndex].name, i + batchIndex));
        }
      });
      
      // API 호출 제한을 위한 지연
      if (i + batchSize < imageFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ 이미지 분석 완료: ${results.length}개`);
    return results;
  }

  /**
   * 분석 결과를 바탕으로 스토리 흐름 결정
   */
  public determineStoryFlow(analyses: ImageAnalysisResult[]): StoryFlow[] {
    return analyses.map((analysis, index) => {
      const { sequenceHints } = analysis;
      
      // 스토리 아크 결정
      let arc: StoryFlow['arc'];
      let position: number;
      
      if (sequenceHints.isBeginning > 0.7) {
        arc = 'setup';
        position = 0.1;
      } else if (sequenceHints.isEnding > 0.7) {
        arc = 'resolution';
        position = 0.9;
      } else if (index / analyses.length > 0.6) {
        arc = 'climax';
        position = 0.7;
      } else {
        arc = 'development';
        position = 0.3 + (index / analyses.length) * 0.4;
      }
      
      const reasoning = this.generateStoryReasoning(analysis, index, analyses.length);
      
      return {
        arc,
        position,
        reasoning
      };
    });
  }

  /**
   * 스토리 순서 결정 근거 생성
   */
  private generateStoryReasoning(
    analysis: ImageAnalysisResult, 
    index: number, 
    totalCount: number
  ): string {
    const reasons: string[] = [];
    
    if (analysis.sequenceHints.isBeginning > 0.6) {
      reasons.push('시작 장면의 특징 감지');
    }
    
    if (analysis.sequenceHints.isEnding > 0.6) {
      reasons.push('마무리 장면의 특징 감지');
    }
    
    if (analysis.analysis.temporalClues.length > 0) {
      reasons.push(`시간적 단서: ${analysis.analysis.temporalClues.join(', ')}`);
    }
    
    if (analysis.analysis.timeOfDay) {
      reasons.push(`시간대: ${analysis.analysis.timeOfDay}`);
    }
    
    reasons.push(`전체 ${totalCount}개 중 ${index + 1}번째 위치`);
    
    return reasons.join(' | ');
  }

  /**
   * 분석 결과 요약 리포트 생성
   */
  public generateAnalysisReport(analyses: ImageAnalysisResult[]): {
    totalImages: number;
    averageConfidence: number;
    storyElements: {
      scenes: string[];
      timeProgression: string[];
      keyObjects: string[];
      emotions: string[];
    };
    sequenceRecommendations: string[];
  } {
    const scenes = [...new Set(analyses.map(a => a.analysis.scene))];
    const timeProgression = analyses
      .filter(a => a.analysis.timeOfDay)
      .map(a => a.analysis.timeOfDay!);
    
    const keyObjects = [...new Set(
      analyses.flatMap(a => a.analysis.objects)
    )].slice(0, 10);
    
    const emotions = [...new Set(
      analyses.flatMap(a => a.analysis.emotions)
    )];

    const averageConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    const recommendations: string[] = [];
    
    if (averageConfidence < 0.6) {
      recommendations.push('이미지 품질을 높이면 더 정확한 분석이 가능합니다');
    }
    
    const beginningCount = analyses.filter(a => a.sequenceHints.isBeginning > 0.7).length;
    const endingCount = analyses.filter(a => a.sequenceHints.isEnding > 0.7).length;
    
    if (beginningCount === 0) {
      recommendations.push('명확한 시작 장면을 추가하면 스토리가 더 명확해집니다');
    }
    
    if (endingCount === 0) {
      recommendations.push('명확한 마무리 장면을 추가하면 스토리가 완성됩니다');
    }

    return {
      totalImages: analyses.length,
      averageConfidence,
      storyElements: {
        scenes,
        timeProgression,
        keyObjects,
        emotions
      },
      sequenceRecommendations: recommendations
    };
  }
}

export const geminiImageAnalyzer = new GeminiImageAnalyzer();