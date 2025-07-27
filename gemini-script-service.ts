import { GoogleGenerativeAI } from '@google/generative-ai';

interface Template {
  templateId: string;
  name: string;
  category: string;
  targetDuration: number;
  structure: Record<string, TemplateSection>;
  style: TemplateStyle;
  rules: string[];
}

interface TemplateSection {
  duration: number;
  purpose: string;
  prompt: string;
}

interface TemplateStyle {
  tone: string;
  vocabulary: string;
  sentence_pattern: string;
  emotion: string;
}

interface ScriptGenerationRequest {
  title: string;
  imageAnalysis: ImageAnalysisResult;
  template: Template;
  customInstructions?: string;
}

interface ScriptSegment {
  type: string;
  text: string;
  estimatedDuration: number;
}

interface GeneratedScript {
  script: string;
  segments: ScriptSegment[];
  totalDuration: number;
  metadata: {
    tone: string;
    keyWords: string[];
    emotionalArc: string[];
  };
}

export class GeminiScriptService {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = this.buildPrompt(request);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      
      // JSON 응답 파싱
      const parsedResponse = this.parseGeminiResponse(rawText);
      
      // 타이밍 검증 및 조정
      const validatedScript = this.validateAndAdjustTiming(
        parsedResponse, 
        request.template.targetDuration
      );
      
      return validatedScript;
    } catch (error) {
      console.error('Gemini API 에러:', error);
      throw new Error('스크립트 생성 중 오류가 발생했습니다.');
    }
  }

  private buildPrompt(request: ScriptGenerationRequest): string {
    const { title, imageAnalysis, template, customInstructions } = request;
    
    const structurePrompts = Object.entries(template.structure)
      .map(([key, section]) => `${key}: ${section.prompt} (${section.duration}초)`)
      .join('\n');

    return `
당신은 전문 쇼츠 영상 스크립트 작가입니다.

## 입력 정보
- 제목: "${title}"
- 이미지 분석 결과: ${JSON.stringify(imageAnalysis, null, 2)}
- 타겟 영상 길이: ${template.targetDuration}초

## 템플릿 정보
카테고리: ${template.category}
스타일: ${JSON.stringify(template.style, null, 2)}

## 구조 요구사항
${structurePrompts}

## 스타일 가이드
- 톤: ${template.style.tone}
- 어휘: ${template.style.vocabulary}
- 문장 패턴: ${template.style.sentence_pattern}
- 감정: ${template.style.emotion}

## 준수 규칙
${template.rules.map(rule => `- ${rule}`).join('\n')}

${customInstructions ? `\n## 추가 요구사항\n${customInstructions}` : ''}

## 출력 형식 (반드시 JSON 형태로 응답)
{
  "script": "전체 스크립트를 자연스럽게 연결한 텍스트",
  "segments": [
    {
      "type": "구조의 키명 (예: hook, main, cta)",
      "text": "해당 세그먼트의 텍스트",
      "estimatedDuration": 예상 소요 시간(초)
    }
  ],
  "totalDuration": 전체 예상 시간,
  "metadata": {
    "tone": "실제 사용된 톤",
    "keyWords": ["핵심 키워드들"],
    "emotionalArc": ["감정의 흐름"]
  }
}

정확히 ${template.targetDuration}초에 맞춰 스크립트를 작성해주세요.
`;
  }

  private parseGeminiResponse(rawText: string): GeneratedScript {
    try {
      // JSON 응답에서 코드 블록 제거
      const cleanedText = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('응답 파싱 에러:', error);
      throw new Error('AI 응답을 파싱하는 중 오류가 발생했습니다.');
    }
  }

  private validateAndAdjustTiming(
    script: GeneratedScript, 
    targetDuration: number
  ): GeneratedScript {
    // 한국어 TTS 기준으로 실제 시간 계산
    const actualDuration = this.calculateActualDuration(script.script);
    
    if (Math.abs(actualDuration - targetDuration) > 3) {
      console.warn(`타이밍 차이: 목표 ${targetDuration}초, 실제 ${actualDuration}초`);
      // 필요시 스크립트 조정 로직 추가
    }
    
    return {
      ...script,
      totalDuration: actualDuration
    };
  }

  private calculateActualDuration(text: string): number {
    // 한국어 TTS 평균 속도: 분당 200-250음절
    const koreanSyllables = (text.match(/[가-힣]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;
    
    // 총 음절 수 계산 (영어 단어는 음절 2개, 숫자는 1개로 계산)
    const totalSyllables = koreanSyllables + (englishWords * 2) + numbers;
    
    // 평균 발화 속도 220음절/분 + 자연스러운 쉼 15% 추가
    const baseSpeed = 220; // 분당 음절
    const pauseFactor = 1.15;
    
    return Math.round((totalSyllables / baseSpeed * 60) * pauseFactor);
  }
}

// 사용 예시
export async function generateScriptAPI(req: any, res: any) {
  try {
    const geminiService = new GeminiScriptService(process.env.GEMINI_API_KEY!);
    
    const { projectId, templateId, title, imageUrls, customInstructions } = req.body;
    
    // 1. 이미지 분석 (기존 OpenAI Vision 활용)
    const imageAnalysis = await analyzeImages(imageUrls);
    
    // 2. 템플릿 조회
    const template = await getTemplate(templateId);
    
    // 3. 스크립트 생성
    const generatedScript = await geminiService.generateScript({
      title,
      imageAnalysis,
      template,
      customInstructions
    });
    
    // 4. 데이터베이스에 저장
    await saveScriptGeneration({
      projectId,
      templateId,
      inputTitle: title,
      imageAnalysisResult: imageAnalysis,
      generatedScript: generatedScript.script,
      scriptMetadata: generatedScript.metadata,
      generationTime: Date.now() - startTime
    });
    
    res.json({
      success: true,
      data: generatedScript
    });
    
  } catch (error) {
    console.error('스크립트 생성 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '스크립트 생성 중 오류가 발생했습니다.'
    });
  }
}