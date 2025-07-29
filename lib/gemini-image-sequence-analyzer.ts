// Gemini Vision API를 사용한 실제 이미지 내용 기반 순서 분석
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';
import fs from 'fs';
import path from 'path';

export interface ImageSequenceAnalysis {
  filename: string;
  imageIndex: number;
  contentAnalysis: {
    sceneDescription: string; // 장면 묘사
    temporalIndicators: string[]; // 시간적 지표들
    sequenceClues: string[]; // 순서 단서들
    visualElements: {
      lighting: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'artificial';
      peoplePositions: string[]; // 사람들의 위치나 자세
      objectStates: string[]; // 물체의 상태 변화
      sceneProgression: string; // 장면의 진행 상태
    };
  };
  sequenceInference: {
    inferredPosition: number; // 1-10 스케일에서 추정 위치
    confidence: number; // 0-1 신뢰도
    reasoning: string[]; // 순서 추론 근거
    relativeMarkers: {
      isOpening: number; // 0-1, 시작 장면일 확률
      isContinuation: number; // 0-1, 연속 장면일 확률  
      isClimax: number; // 0-1, 클라이맥스일 확률
      isConclusion: number; // 0-1, 마무리 장면일 확률
    };
  };
  temporalRelationships: {
    // 다른 이미지들과의 시간적 관계 (배치 분석에서 설정)
    comesBefore: string[]; // 이 이미지보다 앞서는 이미지들
    comesAfter: string[]; // 이 이미지보다 뒤에 오는 이미지들
    simultaneousWith: string[]; // 같은 시점의 이미지들
  };
}

export interface BatchImageSequenceAnalysis {
  images: ImageSequenceAnalysis[];
  overallAnalysis: {
    storyStructure: 'linear' | 'parallel' | 'flashback' | 'mixed';
    recommendedSequence: number[]; // 추천 순서 (이미지 인덱스)
    confidence: number; // 전체 분석 신뢰도
    narrativeFlow: {
      beginning: number[]; // 시작 이미지들
      development: number[]; // 전개 이미지들  
      climax: number[]; // 클라이맥스 이미지들
      resolution: number[]; // 해결 이미지들
    };
    temporalConsistency: number; // 시간적 일관성 점수
    conflictResolutions: string[]; // 순서 충돌 해결 방법
  };
}

export class GeminiImageSequenceAnalyzer {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    console.log('🔍 Gemini 이미지 순서 분석기 초기화');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 단일 이미지의 내용을 분석하여 순서 단서 추출
   */
  public async analyzeImageContent(
    imageFile: any, 
    index: number, 
    allImages: any[]
  ): Promise<ImageSequenceAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      console.log(`🔍 이미지 "${imageFile.name}" 내용 분석 중...`);
      
      // 이미지를 Base64로 변환
      const imageData = await this.convertImageToBase64(imageFile);
      
      const prompt = this.buildImageAnalysisPrompt(imageFile.name, allImages.length);
      
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
      
      console.log(`✅ 이미지 "${imageFile.name}" 분석 완료`);
      
      const parsedAnalysis = this.parseImageAnalysisResponse(analysisText, imageFile.name, index);
      
      return parsedAnalysis;
      
    } catch (error) {
      console.error(`❌ 이미지 분석 실패 (${imageFile.name}):`, error);
      return this.getDefaultImageAnalysis(imageFile.name, index);
    }
  }

  /**
   * 여러 이미지를 배치로 분석하여 상대적 순서 결정
   */
  public async analyzeBatchImageSequence(imageFiles: any[]): Promise<BatchImageSequenceAnalysis> {
    try {
      console.log(`🔍 ${imageFiles.length}개 이미지 배치 순서 분석 시작...`);
      
      // 1단계: 각각의 이미지 내용 분석
      const individualAnalyses: ImageSequenceAnalysis[] = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        console.log(`📸 이미지 ${i + 1}/${imageFiles.length} 분석 중...`);
        
        const analysis = await this.analyzeImageContent(imageFile, i, imageFiles);
        individualAnalyses.push(analysis);
        
        // API 호출 제한을 위한 지연
        if (i < imageFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 2단계: 배치 분석으로 상대적 순서 결정
      console.log('🔄 이미지들 간의 시간적 관계 분석 중...');
      
      const batchAnalysis = await this.performBatchSequenceAnalysis(individualAnalyses);
      
      // 3단계: 시간적 관계 설정
      const analysesWithRelationships = this.establishTemporalRelationships(
        individualAnalyses, 
        batchAnalysis
      );
      
      console.log(`✅ 배치 이미지 순서 분석 완료`);
      
      return {
        images: analysesWithRelationships,
        overallAnalysis: batchAnalysis
      };
      
    } catch (error) {
      console.error('❌ 배치 이미지 분석 실패:', error);
      return this.getDefaultBatchAnalysis(imageFiles);
    }
  }

  /**
   * 이미지 분석을 위한 프롬프트 구성
   */
  private buildImageAnalysisPrompt(filename: string, totalImages: number): string {
    return `
이미지를 자세히 분석하여 이것이 스토리나 시퀀스에서 어느 위치에 해당하는지 판단해주세요.

파일명: "${filename}"
전체 이미지 수: ${totalImages}개

다음 항목들을 JSON 형태로 분석해주세요:

1. 내용 분석 (contentAnalysis):
   - sceneDescription: 이 이미지에서 일어나고 있는 일을 구체적으로 설명
   - temporalIndicators: 시간의 흐름을 나타내는 요소들 (시계, 해의 위치, 그림자 등)
   - sequenceClues: 순서를 추론할 수 있는 단서들 (동작의 진행 상태, 표정 변화 등)
   - visualElements:
     * lighting: 조명 상태 (dawn/morning/noon/afternoon/evening/night/artificial)
     * peoplePositions: 사람들의 위치, 자세, 동작 상태
     * objectStates: 물체들의 상태나 변화
     * sceneProgression: 장면이 시작/진행/마무리 중 어느 단계인지

2. 순서 추론 (sequenceInference):
   - inferredPosition: 전체 ${totalImages}개 중에서 이 이미지가 몇 번째일 것 같은지 (1-${totalImages})
   - confidence: 순서 추론에 대한 확신도 (0.0-1.0)
   - reasoning: 그렇게 판단한 구체적인 근거들
   - relativeMarkers:
     * isOpening: 시작 장면일 확률 (0.0-1.0)
     * isContinuation: 연속/진행 장면일 확률 (0.0-1.0)
     * isClimax: 클라이맥스/절정 장면일 확률 (0.0-1.0)
     * isConclusion: 마무리/결말 장면일 확률 (0.0-1.0)

응답 형식:
{
  "contentAnalysis": {
    "sceneDescription": "구체적인 장면 설명",
    "temporalIndicators": ["시간 단서1", "시간 단서2"],
    "sequenceClues": ["순서 단서1", "순서 단서2"],
    "visualElements": {
      "lighting": "morning",
      "peoplePositions": ["사람의 위치/자세"],
      "objectStates": ["물체 상태"],
      "sceneProgression": "진행 상태"
    }
  },
  "sequenceInference": {
    "inferredPosition": 2,
    "confidence": 0.8,
    "reasoning": ["판단 근거1", "판단 근거2"],
    "relativeMarkers": {
      "isOpening": 0.1,
      "isContinuation": 0.7,
      "isClimax": 0.1,
      "isConclusion": 0.1
    }
  }
}

특별 지침:
- 이미지의 실제 내용을 기반으로 분석하세요
- 사람의 표정, 동작, 자세의 변화에 주목하세요
- 배경의 변화, 조명의 변화, 물체의 위치 변화를 관찰하세요
- 스토리의 자연스러운 흐름을 고려하여 순서를 추론하세요
- 시작-전개-절정-마무리의 구조를 염두에 두세요
`;
  }

  /**
   * 이미지를 Base64로 변환
   */
  private async convertImageToBase64(imageFile: any): Promise<string> {
    try {
      // 서버 환경에서 파일 경로로부터 읽기
      if (typeof imageFile === 'string') {
        const buffer = fs.readFileSync(imageFile);
        return buffer.toString('base64');
      }
      
      // Buffer 객체인 경우
      if (Buffer.isBuffer(imageFile)) {
        return imageFile.toString('base64');
      }
      
      // File 객체인 경우 (브라우저 환경)
      if (imageFile.buffer && Buffer.isBuffer(imageFile.buffer)) {
        return imageFile.buffer.toString('base64');
      }
      
      // 파일 경로가 있는 경우
      if (imageFile.filepath) {
        const buffer = fs.readFileSync(imageFile.filepath);
        return buffer.toString('base64');
      }
      
      throw new Error('지원하지 않는 이미지 형식입니다');
      
    } catch (error) {
      console.error('이미지 Base64 변환 실패:', error);
      throw error;
    }
  }

  /**
   * Gemini 응답 파싱
   */
  private parseImageAnalysisResponse(
    responseText: string, 
    filename: string, 
    index: number
  ): ImageSequenceAnalysis {
    try {
      // JSON 추출 시도
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없음');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        filename,
        imageIndex: index,
        contentAnalysis: {
          sceneDescription: parsed.contentAnalysis?.sceneDescription || '분석 불가',
          temporalIndicators: parsed.contentAnalysis?.temporalIndicators || [],
          sequenceClues: parsed.contentAnalysis?.sequenceClues || [],
          visualElements: {
            lighting: parsed.contentAnalysis?.visualElements?.lighting || 'artificial',
            peoplePositions: parsed.contentAnalysis?.visualElements?.peoplePositions || [],
            objectStates: parsed.contentAnalysis?.visualElements?.objectStates || [],
            sceneProgression: parsed.contentAnalysis?.visualElements?.sceneProgression || '진행 중'
          }
        },
        sequenceInference: {
          inferredPosition: parsed.sequenceInference?.inferredPosition || index + 1,
          confidence: Math.max(0, Math.min(1, parsed.sequenceInference?.confidence || 0.5)),
          reasoning: parsed.sequenceInference?.reasoning || ['AI 분석 기반'],
          relativeMarkers: {
            isOpening: Math.max(0, Math.min(1, parsed.sequenceInference?.relativeMarkers?.isOpening || 0.25)),
            isContinuation: Math.max(0, Math.min(1, parsed.sequenceInference?.relativeMarkers?.isContinuation || 0.5)),
            isClimax: Math.max(0, Math.min(1, parsed.sequenceInference?.relativeMarkers?.isClimax || 0.25)),
            isConclusion: Math.max(0, Math.min(1, parsed.sequenceInference?.relativeMarkers?.isConclusion || 0.25))
          }
        },
        temporalRelationships: {
          comesBefore: [],
          comesAfter: [],
          simultaneousWith: []
        }
      };

    } catch (error) {
      console.error(`이미지 분석 응답 파싱 실패 (${filename}):`, error);
      return this.getDefaultImageAnalysis(filename, index);
    }
  }

  /**
   * 배치 순서 분석 수행
   */
  private async performBatchSequenceAnalysis(
    analyses: ImageSequenceAnalysis[]
  ): Promise<BatchImageSequenceAnalysis['overallAnalysis']> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 각 이미지의 분석 요약 생성
      const summaries = analyses.map((analysis, idx) => ({
        index: idx,
        filename: analysis.filename,
        scene: analysis.contentAnalysis.sceneDescription,
        inferredPos: analysis.sequenceInference.inferredPosition,
        confidence: analysis.sequenceInference.confidence,
        markers: analysis.sequenceInference.relativeMarkers
      }));
      
      const batchPrompt = `
다음 이미지들의 개별 분석 결과를 바탕으로 전체적인 순서를 결정해주세요:

${summaries.map(s => `
이미지 ${s.index + 1}: ${s.filename}
- 장면: ${s.scene}
- 추론 위치: ${s.inferredPos}
- 신뢰도: ${s.confidence}
- 시작 확률: ${s.markers.isOpening}
- 마무리 확률: ${s.markers.isConclusion}
`).join('\n')}

전체적인 순서와 스토리 구조를 JSON으로 분석해주세요:

{
  "storyStructure": "linear|parallel|flashback|mixed",
  "recommendedSequence": [0, 1, 2, ...],
  "confidence": 0.85,
  "narrativeFlow": {
    "beginning": [0],
    "development": [1, 2],
    "climax": [3],
    "resolution": [4]
  },
  "temporalConsistency": 0.9,
  "conflictResolutions": ["해결 방법들"]
}

지침:
- 각 이미지의 내용 분석을 종합하여 가장 자연스러운 순서를 결정하세요
- 스토리의 논리적 흐름을 고려하세요
- 시간적 단서들을 종합하여 일관성을 확인하세요
`;

      const result = await model.generateContent(batchPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseBatchAnalysisResponse(analysisText, analyses.length);
      
    } catch (error) {
      console.error('배치 분석 실패:', error);
      return this.getDefaultOverallAnalysis(analyses.length);
    }
  }

  /**
   * 배치 분석 응답 파싱
   */
  private parseBatchAnalysisResponse(
    responseText: string, 
    imageCount: number
  ): BatchImageSequenceAnalysis['overallAnalysis'] {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없음');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        storyStructure: parsed.storyStructure || 'linear',
        recommendedSequence: parsed.recommendedSequence || Array.from({length: imageCount}, (_, i) => i),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        narrativeFlow: {
          beginning: parsed.narrativeFlow?.beginning || [0],
          development: parsed.narrativeFlow?.development || [],
          climax: parsed.narrativeFlow?.climax || [],
          resolution: parsed.narrativeFlow?.resolution || [imageCount - 1]
        },
        temporalConsistency: Math.max(0, Math.min(1, parsed.temporalConsistency || 0.7)),
        conflictResolutions: parsed.conflictResolutions || []
      };

    } catch (error) {
      console.error('배치 분석 응답 파싱 실패:', error);
      return this.getDefaultOverallAnalysis(imageCount);
    }
  }

  /**
   * 시간적 관계 설정
   */
  private establishTemporalRelationships(
    analyses: ImageSequenceAnalysis[],
    overallAnalysis: BatchImageSequenceAnalysis['overallAnalysis']
  ): ImageSequenceAnalysis[] {
    const sequence = overallAnalysis.recommendedSequence;
    
    return analyses.map((analysis, index) => {
      const positionInSequence = sequence.indexOf(index);
      
      const comesBefore = sequence.slice(positionInSequence + 1).map(idx => analyses[idx].filename);
      const comesAfter = sequence.slice(0, positionInSequence).map(idx => analyses[idx].filename);
      
      return {
        ...analysis,
        temporalRelationships: {
          comesBefore,
          comesAfter,
          simultaneousWith: [] // 동시 이미지는 추후 확장
        }
      };
    });
  }

  /**
   * 기본 이미지 분석 결과 (실패 시)
   */
  private getDefaultImageAnalysis(filename: string, index: number): ImageSequenceAnalysis {
    return {
      filename,
      imageIndex: index,
      contentAnalysis: {
        sceneDescription: '이미지 분석 실패',
        temporalIndicators: [],
        sequenceClues: [],
        visualElements: {
          lighting: 'artificial',
          peoplePositions: [],
          objectStates: [],
          sceneProgression: '알 수 없음'
        }
      },
      sequenceInference: {
        inferredPosition: index + 1,
        confidence: 0.1,
        reasoning: ['이미지 분석 실패로 기본값 적용'],
        relativeMarkers: {
          isOpening: 0.25,
          isContinuation: 0.5,
          isClimax: 0.25,
          isConclusion: 0.25
        }
      },
      temporalRelationships: {
        comesBefore: [],
        comesAfter: [],
        simultaneousWith: []
      }
    };
  }

  /**
   * 기본 전체 분석 결과 (실패 시)
   */
  private getDefaultOverallAnalysis(imageCount: number): BatchImageSequenceAnalysis['overallAnalysis'] {
    return {
      storyStructure: 'linear',
      recommendedSequence: Array.from({length: imageCount}, (_, i) => i),
      confidence: 0.3,
      narrativeFlow: {
        beginning: [0],
        development: Array.from({length: Math.max(0, imageCount - 2)}, (_, i) => i + 1),
        climax: imageCount > 2 ? [imageCount - 2] : [],
        resolution: [imageCount - 1]
      },
      temporalConsistency: 0.3,
      conflictResolutions: ['이미지 분석 실패로 기본 순서 적용']
    };
  }

  /**
   * 기본 배치 분석 결과 (실패 시)
   */
  private getDefaultBatchAnalysis(imageFiles: any[]): BatchImageSequenceAnalysis {
    const images = imageFiles.map((file, index) => 
      this.getDefaultImageAnalysis(file.name || `image_${index}`, index)
    );

    return {
      images,
      overallAnalysis: this.getDefaultOverallAnalysis(imageFiles.length)
    };
  }
}

export const geminiImageSequenceAnalyzer = new GeminiImageSequenceAnalyzer();