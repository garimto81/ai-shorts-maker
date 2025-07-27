// API 엔드포인트: 사용 가능한 TTS 음성 목록 조회

import { NextApiRequest, NextApiResponse } from 'next';
import { geminiTTS } from '@/lib/gemini-tts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 한글 인코딩 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. GET 요청만 지원됩니다.' 
    });
  }

  try {
    console.log('🎤 TTS 음성 목록 조회 요청');

    // 사용 가능한 음성 목록 조회
    const voices = geminiTTS.getAvailableVoices();
    
    // 엔진 상태 확인
    const healthStatus = await geminiTTS.healthCheck();

    console.log('✅ TTS 음성 목록 조회 완료:', {
      voiceCount: voices.length,
      engineStatus: healthStatus.status
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: {
        voices,
        engineStatus: healthStatus,
        supportedLanguages: ['ko', 'en', 'ja', 'zh'],
        supportedStyles: ['neutral', 'cheerful', 'calm', 'excited', 'professional'],
        supportedSpeeds: ['slow', 'normal', 'fast'],
        supportedFormats: ['wav'],
        maxTextLength: 5000
      },
      message: '사용 가능한 음성 목록을 성공적으로 조회했습니다.',
      metadata: {
        queriedAt: new Date().toISOString(),
        engine: 'Gemini 2.5 TTS',
        version: '1.5.0'
      }
    });

  } catch (error: any) {
    console.error('❌ TTS 음성 목록 조회 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'TTS 음성 목록 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: 'VOICE_LIST_ERROR'
    });
  }
}