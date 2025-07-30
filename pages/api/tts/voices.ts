// API 엔드포인트: 활기찬 TTS 음성 목록 조회

import { NextApiRequest, NextApiResponse } from 'next';
import { getEnergeticVoiceGenerator } from '../../../lib/energetic-voice-generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 한글 인코딩 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // OPTIONS 요청 처리 (CORS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. GET 요청만 지원됩니다.' 
    });
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('🎤 활기찬 TTS 음성 목록 조회 요청');

    // 활기찬 음성 생성기 초기화
    const generator = getEnergeticVoiceGenerator();
    
    if (!generator) {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs API가 구성되지 않았습니다. ELEVENLABS_API_KEY를 설정하세요.'
      });
    }

    // 사용 가능한 목소리 목록 가져오기
    const voices = generator.getAvailableVoices();

    console.log('✅ 활기찬 TTS 음성 목록 조회 완료:', {
      voiceCount: voices.length
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: {
        voices: voices.map(voice => ({
          id: voice.id,
          name: voice.name,
          gender: voice.gender,
          characteristics: voice.characteristics,
          description: voice.characteristics.join(', '),
          preview: {
            text: voice.gender === 'female' 
              ? '안녕하세요! 저는 ' + voice.name + '입니다. 밝고 활기찬 목소리로 여러분과 함께해요!'
              : '안녕하세요! 저는 ' + voice.name + '입니다. 활기차고 에너지 넘치는 목소리로 인사드려요!'
          }
        })),
        total: voices.length,
        emotions: [
          { value: 'excited', label: '신남', description: '신나고 기쁜 감정' },
          { value: 'motivated', label: '동기부여', description: '동기부여와 격려' },
          { value: 'enthusiastic', label: '열정적', description: '열정적이고 흥분된' },
          { value: 'cheerful', label: '명랑함', description: '명랑하고 밝은' },
          { value: 'celebratory', label: '축하', description: '축하와 기쁨' }
        ],
        intensityLevels: [
          { value: 'low', label: '낮음', description: '차분하면서도 활기찬' },
          { value: 'medium', label: '중간', description: '적당히 활기찬' },
          { value: 'high', label: '높음', description: '매우 활기차고 에너지 넘치는' }
        ]
      },
      message: '활기찬 음성 목록을 성공적으로 조회했습니다.',
      metadata: {
        queriedAt: new Date().toISOString(),
        engine: 'ElevenLabs Multilingual v2',
        version: '2.0.0'
      }
    });

  } catch (error: any) {
    console.error('❌ 활기찬 TTS 음성 목록 조회 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'TTS 음성 목록 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: 'VOICE_LIST_ERROR'
    });
  }
}