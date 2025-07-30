// AI 스크립트 생성 API

import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SubtitleSplitter, ImageSubtitles } from '@/lib/subtitle-splitter';

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

    const { projectTitle, imageCount, imageNames, scriptType, tone, readingSpeed } = req.body;

    console.log('스크립트 생성 API 요청:', { projectTitle, imageCount, scriptType, tone, readingSpeed });

    if (!projectTitle || !imageCount || !imageNames) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const getDuration = () => {
      // 쇼츠용 최대 60초 제한, 이미지 수에 따라 동적 조정
      const maxDuration = 60; // 쇼츠 최대 길이
      const minDurationPerImage = 2; // 이미지당 최소 2초
      const maxDurationPerImage = 5; // 이미지당 최대 5초
      
      switch (scriptType) {
        case 'short': {
          // 짧은 영상: 이미지당 2-3초
          const baseDuration = imageCount * 2.5;
          return Math.min(baseDuration, maxDuration);
        }
        case 'medium': {
          // 중간 영상: 이미지당 3-4초
          const baseDuration = imageCount * 3.5;
          return Math.min(baseDuration, maxDuration);
        }
        case 'long': {
          // 긴 영상: 이미지당 4-5초 (최대 60초)
          const baseDuration = imageCount * 4.5;
          return Math.min(baseDuration, maxDuration);
        }
        default: {
          // 기본값: 이미지당 3초
          const baseDuration = imageCount * 3;
          return Math.min(baseDuration, maxDuration);
        }
      }
    };

    const getToneDescription = () => {
      switch (tone) {
        case 'casual': return '친근하고 편안한 말투로';
        case 'professional': return '전문적이고 정확한 말투로';
        case 'educational': return '교육적이고 설명적인 말투로';
        default: return '친근하고 편안한 말투로';
      }
    };

    const prompt = `
다음 정보를 바탕으로 비디오 스크립트를 작성해주세요:

프로젝트 제목: ${projectTitle}
이미지 개수: ${imageCount}개
파일명들: ${imageNames.join(', ')}
영상 길이: ${getDuration()}초
톤앤매너: ${getToneDescription()}

요구사항:
1. ${getDuration()}초 길이의 영상에 맞는 스크립트
2. ${imageCount}개의 이미지가 순서대로 나타남
3. 각 이미지마다 적절한 나레이션
4. ${getToneDescription()} 작성
5. 자연스러운 흐름과 구성

결과는 다음 JSON 형식으로 반환:
{
  "title": "스크립트 제목",
  "duration": ${getDuration()},
  "sections": [
    {
      "imageIndex": 0,
      "duration": 이미지 표시 시간(초),
      "text": "해당 이미지에 대한 나레이션",
      "transition": "전환 효과 설명 (선택사항)"
    }
  ],
  "narration": "전체 나레이션 텍스트 (연속적으로)",
  "musicSuggestion": "추천 배경음악 스타일"
}

파일명을 보고 내용을 추측하여 자연스러운 스토리를 만들어주세요.
`;

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
      // JSON 파싱 실패 시 기본 스크립트 생성
      const sectionDuration = Math.floor(getDuration() / imageCount);
      scriptData = {
        title: projectTitle,
        duration: getDuration(),
        sections: imageNames.map((name: string, index: number) => ({
          imageIndex: index,
          duration: sectionDuration,
          text: `${index + 1}번째 이미지: ${name}에 대한 설명`,
          transition: index < imageNames.length - 1 ? "페이드 인/아웃" : undefined
        })),
        narration: `${projectTitle}에 대한 이야기를 ${imageCount}개의 이미지로 전달합니다.`,
        musicSuggestion: "부드럽고 감성적인 배경음악"
      };
    }

    // 데이터 검증 및 보정
    if (!scriptData.sections || !Array.isArray(scriptData.sections)) {
      const totalDuration = getDuration();
      const sectionDuration = Math.floor(totalDuration / imageCount);
      scriptData.sections = imageNames.map((name: string, index: number) => ({
        imageIndex: index,
        duration: sectionDuration,
        text: `${name}에 대한 설명`,
        transition: index < imageNames.length - 1 ? "페이드" : undefined
      }));
    }

    // 섹션 시간 재배분 (60초 초과 방지)
    const totalDuration = getDuration();
    if (scriptData.sections && scriptData.sections.length > 0) {
      const currentTotal = scriptData.sections.reduce((sum: number, section: any) => sum + (section.duration || 0), 0);
      
      if (currentTotal > totalDuration) {
        // 각 섹션 시간을 비례적으로 줄임
        const scaleFactor = totalDuration / currentTotal;
        scriptData.sections = scriptData.sections.map((section: any) => ({
          ...section,
          duration: Math.max(1, Math.floor(section.duration * scaleFactor))
        }));
      }
      
      // 최종 총 시간이 정확히 맞도록 마지막 섹션 조정
      const finalTotal = scriptData.sections.reduce((sum: number, section: any) => sum + section.duration, 0);
      if (finalTotal !== totalDuration && scriptData.sections.length > 0) {
        const lastSection = scriptData.sections[scriptData.sections.length - 1];
        lastSection.duration += (totalDuration - finalTotal);
        lastSection.duration = Math.max(1, lastSection.duration); // 최소 1초 보장
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

    // 응답 데이터에 자막 정보 추가
    const responseData = {
      ...scriptData,
      subtitles: {
        imageSubtitles,
        stats: subtitleStats,
        readingSpeed: speed,
        srtFormat: SubtitleSplitter.toSRT(imageSubtitles)
      }
    };

    console.log('자막 생성 완료:', {
      totalSubtitles: subtitleStats.totalSubtitles,
      averagePerImage: subtitleStats.averageSubtitlesPerImage.toFixed(1)
    });

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Script generation error:', error);
    
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
      error: 'AI 스크립트 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}