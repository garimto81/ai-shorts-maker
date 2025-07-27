// API 엔드포인트: 스크립트 자동 생성 (본문 기반 메타데이터 추론)

import { NextApiRequest, NextApiResponse } from 'next';
import { scriptAutoGenerator } from '@/lib/script-auto-generator';

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
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: '본문 내용이 너무 짧습니다. 최소 10자 이상 입력해주세요.'
      });
    }

    console.log('AI 자동 생성 요청:', { 
      contentLength: content.length, 
      contentPreview: content.substring(0, 50) + '...' 
    });

    // AI 자동 생성 실행
    const result = await scriptAutoGenerator.generateFromContent({ content });

    console.log('AI 자동 생성 결과:', { 
      title: result.title, 
      category: result.category, 
      confidence: result.aiAnalysis.confidence 
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'AI가 성공적으로 메타데이터를 생성했습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 자동 생성 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '자동 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}