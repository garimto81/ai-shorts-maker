// Gemini AI를 사용한 파일명 의미 분석 및 순서 추론 시스템

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env-config';

export interface FilenameAnalysisResult {
  filename: string;
  semanticAnalysis: {
    category: string; // 'sequence', 'temporal', 'descriptive', 'random'
    description: string; // 파일명이 의미하는 바
    keywords: string[]; // 추출된 핵심 키워드
    language: 'korean' | 'english' | 'mixed' | 'numeric';
    hasSequentialPattern: boolean; // 순서 패턴 존재 여부
    hasTemporalElements: boolean; // 시간 요소 존재 여부
  };
  sequenceInference: {
    inferredOrder: number; // AI가 추론한 순서 (1-10)
    orderConfidence: number; // 순서 추론 신뢰도 (0-1)
    orderReasoning: string[]; // 순서 추론 근거
    relativePosition: 'beginning' | 'middle' | 'end' | 'unknown';
  };
  similarity: {
    // 다른 파일명들과의 유사도 (batch 분석에서 채워짐)
    patternGroup: string; // 같은 패턴 그룹 ID
    namingStyle: string; // 명명 스타일 분류
  };
  confidence: number; // 전체 분석 신뢰도 (0-1)
}

export interface BatchFilenameAnalysis {
  files: FilenameAnalysisResult[];
  groupAnalysis: {
    dominantPattern: string; // 주요 패턴
    consistencyScore: number; // 일관성 점수 (0-1)
    recommendedOrder: number[]; // 추천 순서 (파일 인덱스)
    conflictResolutions: string[]; // 충돌 해결 방법
  };
}

export class GeminiFilenameAnalyzer {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    console.log('🔤 Gemini 파일명 분석기 초기화');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 단일 파일명 분석
   */
  public async analyzeFilename(filename: string, index: number, allFilenames: string[]): Promise<FilenameAnalysisResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = this.buildFilenameAnalysisPrompt(filename, allFilenames);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log(`🔤 파일명 "${filename}" AI 분석 중...`);
      
      const parsedAnalysis = this.parseFilenameAnalysisResponse(analysisText, filename, index);
      
      return parsedAnalysis;
      
    } catch (error) {
      console.error(`파일명 분석 실패 (${filename}):`, error);
      return this.getDefaultFilenameAnalysis(filename, index);
    }
  }

  /**
   * 배치 파일명 분석 (전체 파일들을 함께 분석하여 상대적 순서 추론)
   */
  public async analyzeBatch(filenames: string[]): Promise<BatchFilenameAnalysis> {
    try {
      console.log(`🔤 ${filenames.length}개 파일명 배치 분석 시작...`);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = this.buildBatchAnalysisPrompt(filenames);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('📊 배치 분석 결과 파싱 중...');
      
      const batchAnalysis = await this.parseBatchAnalysisResponse(analysisText, filenames);
      
      console.log(`✅ 배치 분석 완료: ${batchAnalysis.groupAnalysis.dominantPattern} 패턴 감지`);
      
      return batchAnalysis;
      
    } catch (error) {
      console.error('배치 파일명 분석 실패:', error);
      return this.getDefaultBatchAnalysis(filenames);
    }
  }

  /**
   * 파일명 분석 프롬프트 구성
   */
  private buildFilenameAnalysisPrompt(filename: string, allFilenames: string[]): string {
    return `
다음 파일명을 분석하여 의미와 순서를 추론해주세요:

분석 대상 파일명: "${filename}"

전체 파일명 목록:
${allFilenames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

다음 항목들을 JSON 형태로 분석해주세요:

1. 의미 분석 (semanticAnalysis):
   - category: 'sequence'(순서형), 'temporal'(시간형), 'descriptive'(설명형), 'random'(무작위형) 중 하나
   - description: 파일명이 표현하고자 하는 의미
   - keywords: 핵심 키워드 추출 (최대 5개)
   - language: 'korean', 'english', 'mixed', 'numeric' 중 하나
   - hasSequentialPattern: 순서나 연속성을 나타내는 패턴 존재 여부
   - hasTemporalElements: 시간이나 날짜 요소 존재 여부

2. 순서 추론 (sequenceInference):
   - inferredOrder: 전체 목록에서 이 파일의 적절한 순서 (1~${allFilenames.length})
   - orderConfidence: 순서 추론의 확신도 (0.0~1.0)
   - orderReasoning: 순서를 그렇게 추론한 근거들 (배열)
   - relativePosition: 'beginning', 'middle', 'end', 'unknown' 중 하나

3. 전체 신뢰도 (confidence): 이 분석 결과에 대한 전반적 확신도 (0.0~1.0)

응답 형식:
{
  "semanticAnalysis": {
    "category": "sequence",
    "description": "설명",
    "keywords": ["키워드1", "키워드2"],
    "language": "korean",
    "hasSequentialPattern": true,
    "hasTemporalElements": false
  },
  "sequenceInference": {
    "inferredOrder": 1,
    "orderConfidence": 0.9,
    "orderReasoning": ["근거1", "근거2"],
    "relativePosition": "beginning"
  },
  "confidence": 0.85
}

특별 지침:
- 한국어 파일명의 경우 맥락과 의미를 중시하여 분석
- 숫자 패턴뿐만 아니라 의미적 순서도 고려
- "시작", "처음", "첫", "마지막", "끝", "완료" 등의 단어에 주목
- 파일명들 간의 연관성과 스토리 흐름 고려
`;
  }

  /**
   * 배치 분석 프롬프트 구성
   */
  private buildBatchAnalysisPrompt(filenames: string[]): string {
    return `
다음 파일명들을 전체적으로 분석하여 최적의 순서를 추론해주세요:

파일명 목록:
${filenames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

다음을 JSON 형태로 분석해주세요:

1. 그룹 분석 (groupAnalysis):
   - dominantPattern: 주요 명명 패턴 ('sequential_numeric', 'temporal', 'descriptive_story', 'mixed', 'random')
   - consistencyScore: 파일명들의 일관성 점수 (0.0~1.0)
   - recommendedOrder: 추천하는 파일 순서 (1부터 ${filenames.length}까지의 배열)
   - conflictResolutions: 순서 충돌 시 해결 방법들

2. 개별 파일 분석: 각 파일에 대해
   - 의미적 분류와 순서 추론
   - 다른 파일들과의 관계성
   - 패턴 그룹 분류

응답 형식:
{
  "groupAnalysis": {
    "dominantPattern": "sequential_numeric",
    "consistencyScore": 0.8,
    "recommendedOrder": [1, 2, 3, 4, 5],
    "conflictResolutions": ["해결방법1", "해결방법2"]
  },
  "individualAnalysis": [
    {
      "filename": "파일명1",
      "inferredOrder": 1,
      "confidence": 0.9,
      "reasoning": ["근거1", "근거2"],
      "patternGroup": "group_a",
      "relativePosition": "beginning"
    }
  ]
}

분석 지침:
- 파일명의 의미적 순서를 우선 고려 (숫자 순서보다 중요)
- 스토리나 과정의 자연스러운 흐름 파악
- 시작-중간-끝의 스토리 구조 인식
- 한국어 맥락에서의 순서 표현 이해
- 파일명 간 패턴 일관성 평가
`;
  }

  /**
   * 단일 파일명 분석 응답 파싱
   */
  private parseFilenameAnalysisResponse(responseText: string, filename: string, index: number): FilenameAnalysisResult {
    try {
      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없음');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        filename,
        semanticAnalysis: {
          category: parsed.semanticAnalysis?.category || 'random',
          description: parsed.semanticAnalysis?.description || '분석 불가',
          keywords: parsed.semanticAnalysis?.keywords || [],
          language: parsed.semanticAnalysis?.language || 'mixed',
          hasSequentialPattern: parsed.semanticAnalysis?.hasSequentialPattern || false,
          hasTemporalElements: parsed.semanticAnalysis?.hasTemporalElements || false
        },
        sequenceInference: {
          inferredOrder: parsed.sequenceInference?.inferredOrder || index + 1,
          orderConfidence: parsed.sequenceInference?.orderConfidence || 0.3,
          orderReasoning: parsed.sequenceInference?.orderReasoning || ['AI 분석 실패'],
          relativePosition: parsed.sequenceInference?.relativePosition || 'unknown'
        },
        similarity: {
          patternGroup: `group_${Math.floor(index / 3)}`, // 임시 그룹
          namingStyle: parsed.semanticAnalysis?.category || 'unknown'
        },
        confidence: parsed.confidence || 0.3
      };

    } catch (error) {
      console.error(`파일명 분석 응답 파싱 실패 (${filename}):`, error);
      return this.getDefaultFilenameAnalysis(filename, index);
    }
  }

  /**
   * 배치 분석 응답 파싱
   */
  private async parseBatchAnalysisResponse(responseText: string, filenames: string[]): Promise<BatchFilenameAnalysis> {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없음');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 개별 파일 분석 결과 구성
      const fileAnalyses: FilenameAnalysisResult[] = [];
      
      for (let i = 0; i < filenames.length; i++) {
        const filename = filenames[i];
        const individualData = parsed.individualAnalysis?.[i] || {};
        
        fileAnalyses.push({
          filename,
          semanticAnalysis: {
            category: individualData.category || 'random',
            description: individualData.description || '배치 분석 결과',
            keywords: individualData.keywords || [],
            language: 'mixed',
            hasSequentialPattern: true,
            hasTemporalElements: false
          },
          sequenceInference: {
            inferredOrder: individualData.inferredOrder || i + 1,
            orderConfidence: individualData.confidence || 0.5,
            orderReasoning: individualData.reasoning || ['배치 분석 기반'],
            relativePosition: individualData.relativePosition || 'middle'
          },
          similarity: {
            patternGroup: individualData.patternGroup || 'default_group',
            namingStyle: parsed.groupAnalysis?.dominantPattern || 'mixed'
          },
          confidence: individualData.confidence || 0.5
        });
      }

      return {
        files: fileAnalyses,
        groupAnalysis: {
          dominantPattern: parsed.groupAnalysis?.dominantPattern || 'mixed',
          consistencyScore: parsed.groupAnalysis?.consistencyScore || 0.5,
          recommendedOrder: parsed.groupAnalysis?.recommendedOrder || filenames.map((_, i) => i + 1),
          conflictResolutions: parsed.groupAnalysis?.conflictResolutions || []
        }
      };

    } catch (error) {
      console.error('배치 분석 응답 파싱 실패:', error);
      return this.getDefaultBatchAnalysis(filenames);
    }
  }

  /**
   * 기본 파일명 분석 결과 (실패 시)
   */
  private getDefaultFilenameAnalysis(filename: string, index: number): FilenameAnalysisResult {
    return {
      filename,
      semanticAnalysis: {
        category: 'random',
        description: '분석 실패 - 기본 순서 적용',
        keywords: [],
        language: 'mixed',
        hasSequentialPattern: false,
        hasTemporalElements: false
      },
      sequenceInference: {
        inferredOrder: index + 1,
        orderConfidence: 0.1,
        orderReasoning: ['AI 분석 실패로 업로드 순서 적용'],
        relativePosition: 'unknown'
      },
      similarity: {
        patternGroup: 'default',
        namingStyle: 'unknown'
      },
      confidence: 0.1
    };
  }

  /**
   * 기본 배치 분석 결과 (실패 시)
   */
  private getDefaultBatchAnalysis(filenames: string[]): BatchFilenameAnalysis {
    const files = filenames.map((filename, index) => 
      this.getDefaultFilenameAnalysis(filename, index)
    );

    return {
      files,
      groupAnalysis: {
        dominantPattern: 'random',
        consistencyScore: 0.1,
        recommendedOrder: filenames.map((_, i) => i + 1),
        conflictResolutions: ['AI 분석 실패로 기본 순서 유지']
      }
    };
  }

  /**
   * 파일명들의 유사도 계산
   */
  public calculateFilenameSimilarity(filename1: string, filename2: string): number {
    // 간단한 문자열 유사도 계산 (Levenshtein 거리 기반)
    const len1 = filename1.length;
    const len2 = filename2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const substitutionCost = filename1[i - 1] === filename2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }
}

export const geminiFilenameAnalyzer = new GeminiFilenameAnalyzer();