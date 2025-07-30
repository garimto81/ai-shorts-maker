// 이미지 분석 기반 스크립트 생성 API

import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { imageAnalyzer, BatchAnalysisResult } from '@/lib/image-content-analyzer';
import { SubtitleSplitter } from '@/lib/subtitle-splitter';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
    }

    const { 
      projectTitle, 
      imagePaths, // 서버에 업로드된 이미지 파일 경로들
      scriptType, 
      tone, 
      readingSpeed 
    } = req.body;

    console.log('이미지 기반 스크립트 생성 API 요청:', { 
      projectTitle, 
      imageCount: imagePaths?.length, 
      scriptType, 
      tone, 
      readingSpeed 
    });

    if (!projectTitle || !imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    // 1단계: 이미지 내용 분석
    console.log('🔍 이미지 분석 시작...');
    const imageAnalysis: BatchAnalysisResult = await imageAnalyzer.analyzeBatch(
      imagePaths.map((p: string) => path.join(process.cwd(), 'public', p))
    );

    // 2단계: 동적 시간 계산
    const getDuration = () => {
      const maxDuration = 60;
      const imageCount = imagePaths.length;
      
      switch (scriptType) {
        case 'short': {
          const baseDuration = imageCount * 2.5;
          return Math.min(baseDuration, maxDuration);
        }
        case 'medium': {
          const baseDuration = imageCount * 3.5;
          return Math.min(baseDuration, maxDuration);
        }
        case 'long': {
          const baseDuration = imageCount * 4.5;
          return Math.min(baseDuration, maxDuration);
        }
        default: {
          const baseDuration = imageCount * 3;
          return Math.min(baseDuration, maxDuration);
        }
      }
    };

    const getToneDescription = () => {
      // 이미지 분석 결과의 추천 톤이 있으면 우선 사용
      const recommendedTone = tone || imageAnalysis.recommendedTone;
      
      switch (recommendedTone) {
        case 'casual': return '친근하고 편안한 말투로';
        case 'professional': return '전문적이고 정확한 말투로';
        case 'educational': return '교육적이고 설명적인 말투로';
        default: return '친근하고 편안한 말투로';
      }
    };

    // 3단계: 이미지 분석 결과를 바탕으로 스크립트 생성
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const totalDuration = getDuration();
    const imageAnalysisText = imageAnalysis.images.map((img, index) => 
      `이미지 ${index + 1}: ${img.analysis.description}
- 주요 객체: ${img.analysis.mainSubjects.join(', ')}
- 장면: ${img.analysis.scene}
- 분위기: ${img.analysis.mood}
- 추천 나레이션: ${img.suggestedNarration}`
    ).join('\n\n');

    const prompt = `
다음은 실제 이미지 분석 결과를 바탕으로 한 비디오 스크립트 작성 요청입니다:

프로젝트 제목: ${projectTitle}
총 이미지 수: ${imagePaths.length}개
영상 길이: ${totalDuration}초
톤앤매너: ${getToneDescription()}
전체 테마: ${imageAnalysis.overallTheme}
스토리 흐름: ${imageAnalysis.storyFlow}

=== 각 이미지 분석 결과 ===
${imageAnalysisText}

요구사항:
1. ${totalDuration}초 길이의 영상에 맞는 스크립트
2. 실제 이미지 내용을 정확히 반영한 나레이션
3. 각 이미지의 분석 결과를 활용한 구체적이고 흥미로운 설명
4. ${getToneDescription()} 작성
5. 자연스러운 스토리 흐름과 연결성
6. 쇼츠 영상에 적합한 몰입감 있는 구성

결과는 다음 JSON 형식으로 반환:
{
  "title": "스크립트 제목",
  "duration": ${totalDuration},
  "sections": [
    {
      "imageIndex": 0,
      "duration": 이미지 표시 시간(초),
      "text": "실제 이미지 내용을 반영한 구체적인 나레이션",
      "transition": "전환 효과 설명 (선택사항)",
      "imageContext": "이 이미지에서 주목할 점이나 특징"
    }
  ],
  "narration": "전체 나레이션 텍스트 (연속적으로)",
  "musicSuggestion": "추천 배경음악 스타일",
  "analysisBasedImprovements": "이미지 분석을 통해 개선된 점들"
}

중요: 각 섹션의 text는 해당 이미지의 실제 분석 결과를 바탕으로 구체적이고 정확하게 작성해주세요.
파일명이 아닌 실제 이미지 내용을 설명해야 합니다.
`;

    console.log('🤖 AI 스크립트 생성 중...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let scriptText = response.text();

    // JSON 추출
    const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('유효한 JSON 응답을 받지 못했습니다.');
    }

    let scriptData;
    try {
      scriptData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.warn('JSON 파싱 실패, 분석 결과로 기본 스크립트 생성');
      
      // 이미지 분석 결과를 바탕으로 기본 스크립트 생성
      const sectionDuration = Math.floor(totalDuration / imagePaths.length);
      scriptData = {
        title: projectTitle,
        duration: totalDuration,
        sections: imageAnalysis.images.map((img, index) => ({
          imageIndex: index,
          duration: sectionDuration,
          text: img.suggestedNarration,
          transition: index < imagePaths.length - 1 ? "페이드 인/아웃" : undefined,
          imageContext: img.analysis.description
        })),
        narration: imageAnalysis.images.map(img => img.suggestedNarration).join(' '),
        musicSuggestion: "이미지 분위기에 맞는 배경음악",
        analysisBasedImprovements: "이미지 분석을 통해 각 장면에 맞는 구체적인 나레이션을 생성했습니다."
      };
    }

    // 섹션 시간 재배분 (60초 초과 방지)
    if (scriptData.sections && scriptData.sections.length > 0) {
      const currentTotal = scriptData.sections.reduce((sum: number, section: any) => sum + (section.duration || 0), 0);
      
      if (currentTotal > totalDuration) {
        const scaleFactor = totalDuration / currentTotal;
        scriptData.sections = scriptData.sections.map((section: any) => ({
          ...section,
          duration: Math.max(1, Math.floor(section.duration * scaleFactor))
        }));
      }
      
      // 최종 총 시간 조정
      const finalTotal = scriptData.sections.reduce((sum: number, section: any) => sum + section.duration, 0);
      if (finalTotal !== totalDuration && scriptData.sections.length > 0) {
        const lastSection = scriptData.sections[scriptData.sections.length - 1];
        lastSection.duration += (totalDuration - finalTotal);
        lastSection.duration = Math.max(1, lastSection.duration);
      }
    }

    // 스크립트 총 길이 업데이트
    scriptData.duration = totalDuration;

    // 전체 나레이션이 없으면 섹션들을 합쳐서 생성
    if (!scriptData.narration) {
      scriptData.narration = scriptData.sections
        .map((section: any) => section.text)
        .join(' ');
    }

    // 자막 분할 처리
    const speed = (readingSpeed as 'slow' | 'normal' | 'fast') || 'normal';
    const imageSubtitles = SubtitleSplitter.generateImageSubtitles(scriptData.sections, speed);
    const subtitleStats = SubtitleSplitter.getSubtitleStats(imageSubtitles);

    // 응답 데이터에 이미지 분석 정보와 자막 정보 추가
    const responseData = {
      ...scriptData,
      imageAnalysis: {
        totalImages: imageAnalysis.images.length,
        overallTheme: imageAnalysis.overallTheme,
        storyFlow: imageAnalysis.storyFlow,
        recommendedTone: imageAnalysis.recommendedTone,
        analysisTime: imageAnalysis.totalAnalysisTime,
        images: imageAnalysis.images.map(img => ({
          filename: img.filename,
          description: img.analysis.description,
          suggestedNarration: img.suggestedNarration,
          confidence: img.confidence,
          mainSubjects: img.analysis.mainSubjects,
          scene: img.analysis.scene,
          mood: img.analysis.mood
        }))
      },
      subtitles: {
        imageSubtitles,
        stats: subtitleStats,
        readingSpeed: speed,
        srtFormat: SubtitleSplitter.toSRT(imageSubtitles)
      }
    };

    console.log('✅ 이미지 분석 기반 스크립트 생성 완료:', {
      totalImages: imageAnalysis.images.length,
      analysisTime: imageAnalysis.totalAnalysisTime + 'ms',
      totalSubtitles: subtitleStats.totalSubtitles,
      averageConfidence: (imageAnalysis.images.reduce((sum, img) => sum + img.confidence, 0) / imageAnalysis.images.length).toFixed(2)
    });

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('이미지 분석 기반 스크립트 생성 오류:', error);
    
    // Gemini API 특정 오류 처리
    if (error.message?.includes('API key not valid')) {
      return res.status(401).json({ 
        error: 'API 키가 유효하지 않습니다. 올바른 Gemini API 키를 설정해주세요.',
        details: 'Invalid API key'
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({ 
        error: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        details: 'Rate limit exceeded'
      });
    }
    
    res.status(500).json({ 
      error: '이미지 분석 기반 스크립트 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// API 설정 (이미지 분석으로 인한 긴 처리 시간)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
  maxDuration: 300, // 5분 타임아웃 (이미지 분석 시간 고려)
};