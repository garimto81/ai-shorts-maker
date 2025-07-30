// 이미지 내용 분석기 (Google Gemini Vision API 사용)

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ImageAnalysisResult {
  filename: string;
  imagePath: string;
  analysis: {
    description: string; // 이미지에 대한 상세 설명
    mainSubjects: string[]; // 주요 객체들
    scene: string; // 장면 유형 (실내, 실외, 인물, 풍경 등)
    mood: string; // 분위기 (밝은, 어두운, 평화로운, 역동적 등)
    colors: string[]; // 주요 색상들
    actions: string[]; // 관찰되는 행동이나 동작
    context: string; // 맥락적 정보
  };
  suggestedNarration: string; // 이 이미지에 추천되는 나레이션
  confidence: number; // 분석 신뢰도 (0-1)
}

export interface BatchAnalysisResult {
  images: ImageAnalysisResult[];
  overallTheme: string; // 전체적인 테마
  storyFlow: string; // 이야기 흐름 제안
  recommendedTone: 'casual' | 'professional' | 'educational';
  totalAnalysisTime: number; // 분석 소요 시간 (ms)
}

export class ImageContentAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  /**
   * 단일 이미지 분석
   */
  async analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 이미지 분석 시작: ${path.basename(imagePath)}`);

      // 이미지 파일 읽기
      if (!fs.existsSync(imagePath)) {
        throw new Error(`이미지 파일을 찾을 수 없습니다: ${imagePath}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const imageData = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: this.getMimeType(imagePath)
        }
      };

      const prompt = `
이 이미지를 자세히 분석하고 다음 정보를 JSON 형식으로 제공해주세요:

{
  "description": "이미지에 대한 상세하고 구체적인 설명 (한국어, 2-3문장)",
  "mainSubjects": ["주요 객체나 인물들을 배열로 나열"],
  "scene": "장면 유형 (예: 실내, 실외, 스튜디오, 자연, 도시 등)",
  "mood": "이미지의 분위기나 느낌 (예: 밝은, 어두운, 평화로운, 역동적, 따뜻한 등)",
  "colors": ["이미지의 주요 색상들"],
  "actions": ["관찰되는 행동이나 동작, 없으면 빈 배열"],
  "context": "이미지의 맥락이나 배경 상황 설명",
  "suggestedNarration": "이 이미지에 어울리는 나레이션 텍스트 (자연스럽고 흥미로운 1-2문장, 한국어)",
  "confidence": 분석 신뢰도를 0과 1 사이의 숫자로
}

분석 시 다음을 고려해주세요:
1. 구체적이고 정확한 묘사
2. 감정적, 시각적 요소 포함
3. 한국어로 자연스러운 표현
4. 쇼츠용 영상에 적합한 흥미로운 나레이션
5. 시청자의 관심을 끌 수 있는 요소 강조
`;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('유효한 JSON 응답을 받지 못했습니다.');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      
      const analysisResult: ImageAnalysisResult = {
        filename: path.basename(imagePath),
        imagePath: imagePath,
        analysis: {
          description: analysisData.description || '이미지 분석 실패',
          mainSubjects: analysisData.mainSubjects || [],
          scene: analysisData.scene || '알 수 없음',
          mood: analysisData.mood || '중성적',
          colors: analysisData.colors || [],
          actions: analysisData.actions || [],
          context: analysisData.context || ''
        },
        suggestedNarration: analysisData.suggestedNarration || '이미지에 대한 설명입니다.',
        confidence: analysisData.confidence || 0.7
      };

      const analysisTime = Date.now() - startTime;
      console.log(`✅ 이미지 분석 완료: ${path.basename(imagePath)} (${analysisTime}ms)`);
      
      return analysisResult;

    } catch (error: any) {
      console.error(`❌ 이미지 분석 실패: ${path.basename(imagePath)}`, error);
      
      // 실패 시 기본값 반환
      return {
        filename: path.basename(imagePath),
        imagePath: imagePath,
        analysis: {
          description: `${path.basename(imagePath)} 이미지`,
          mainSubjects: [],
          scene: '알 수 없음',
          mood: '중성적',
          colors: [],
          actions: [],
          context: '이미지 분석에 실패했습니다.'
        },
        suggestedNarration: `${path.basename(imagePath)}에 대한 내용입니다.`,
        confidence: 0.3
      };
    }
  }

  /**
   * 여러 이미지 일괄 분석
   */
  async analyzeBatch(imagePaths: string[]): Promise<BatchAnalysisResult> {
    const startTime = Date.now();
    console.log(`🔍 일괄 이미지 분석 시작: ${imagePaths.length}개 이미지`);

    // 각 이미지 개별 분석
    const imageAnalyses: ImageAnalysisResult[] = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      console.log(`📸 분석 진행: ${i + 1}/${imagePaths.length} - ${path.basename(imagePath)}`);
      
      const analysis = await this.analyzeImage(imagePath);
      imageAnalyses.push(analysis);
      
      // API 과부하 방지를 위한 딜레이
      if (i < imagePaths.length - 1) {
        await this.delay(500); // 0.5초 대기
      }
    }

    // 전체적인 테마와 스토리 흐름 분석
    const overallAnalysis = await this.analyzeOverallTheme(imageAnalyses);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ 일괄 분석 완료: ${totalTime}ms`);

    return {
      images: imageAnalyses,
      overallTheme: overallAnalysis.theme,
      storyFlow: overallAnalysis.storyFlow,
      recommendedTone: overallAnalysis.recommendedTone,
      totalAnalysisTime: totalTime
    };
  }

  /**
   * 전체 이미지들의 테마와 스토리 흐름 분석
   */
  private async analyzeOverallTheme(analyses: ImageAnalysisResult[]): Promise<{
    theme: string;
    storyFlow: string;
    recommendedTone: 'casual' | 'professional' | 'educational';
  }> {
    const descriptions = analyses.map(a => a.analysis.description).join('\n');
    const scenes = analyses.map(a => a.analysis.scene).join(', ');
    const moods = analyses.map(a => a.analysis.mood).join(', ');

    const prompt = `
다음은 순서대로 나열된 이미지들의 분석 결과입니다:

이미지 설명들:
${descriptions}

장면 유형들: ${scenes}
분위기들: ${moods}

이 이미지들을 종합적으로 분석하여 다음을 JSON으로 답변해주세요:

{
  "theme": "전체적인 테마나 주제 (한 문장으로 요약)",
  "storyFlow": "이미지들이 보여주는 스토리 흐름이나 연결성에 대한 설명 (2-3문장)",
  "recommendedTone": "추천되는 톤 (casual, professional, educational 중 하나)"
}

분석 기준:
- 이미지들 간의 연관성과 흐름
- 전체적인 분위기와 주제
- 쇼츠 영상에 적합한 톤 추천
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          theme: data.theme || '다양한 주제의 이미지들',
          storyFlow: data.storyFlow || '이미지들이 순서대로 이야기를 전개합니다.',
          recommendedTone: data.recommendedTone || 'casual'
        };
      }
    } catch (error) {
      console.error('전체 테마 분석 실패:', error);
    }

    // 기본값 반환
    return {
      theme: '다양한 이미지들의 모음',
      storyFlow: '각 이미지가 고유한 이야기를 담고 있습니다.',
      recommendedTone: 'casual'
    };
  }

  /**
   * 파일 확장자로 MIME 타입 결정
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.bmp':
        return 'image/bmp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * 딜레이 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
export const imageAnalyzer = new ImageContentAnalyzer();