// API 엔드포인트: 영상화를 위한 스크립트 생성

import { NextApiRequest, NextApiResponse } from 'next';
import { videoScriptGenerator, VideoScriptRequest, ImageAnalysis } from '@/lib/video-script-generator';
import { SampleScript } from '@/lib/script-database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 한글 인코딩 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { 
      scriptId,
      baseScript,
      narrationSpeed = 'normal',
      images = [],
      videoStyle = 'educational'
    } = req.body as {
      scriptId?: string;
      baseScript?: SampleScript;
      narrationSpeed?: 'slow' | 'normal' | 'fast';
      images?: ImageAnalysis[];
      videoStyle?: 'educational' | 'entertainment' | 'promotional' | 'documentary';
    };

    // 기본 스크립트 검증
    if (!baseScript && !scriptId) {
      return res.status(400).json({
        success: false,
        error: '기본 스크립트 또는 스크립트 ID가 필요합니다.'
      });
    }

    let script: SampleScript;
    
    if (baseScript) {
      script = baseScript;
    } else {
      // scriptId로 스크립트 조회 (실제 구현에서는 DB에서 조회)
      return res.status(400).json({
        success: false,
        error: '스크립트 ID로 조회하는 기능은 아직 구현되지 않았습니다. baseScript를 직접 제공해주세요.'
      });
    }

    // 입력 검증
    if (!script.content?.narration) {
      return res.status(400).json({
        success: false,
        error: '스크립트에 나레이션 내용이 없습니다.'
      });
    }

    console.log('영상 스크립트 생성 요청:', {
      title: script.title,
      narrationSpeed,
      videoStyle,
      imageCount: images.length
    });

    // 영상 스크립트 생성 요청 구성
    const request: VideoScriptRequest = {
      baseScript: script,
      narrationSpeed,
      images,
      videoStyle
    };

    // AI를 통한 영상 스크립트 생성
    const result = await videoScriptGenerator.generateVideoScript(request);

    console.log('영상 스크립트 생성 완료:', {
      title: result.title,
      totalDuration: result.totalDuration,
      sceneCount: result.scenes.length,
      narrationSegments: result.narration.segments.length
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: '영상 스크립트가 성공적으로 생성되었습니다.',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: Date.now(),
        version: '1.7.0'
      }
    });

  } catch (error: any) {
    console.error('영상 스크립트 생성 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '영상 스크립트 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}