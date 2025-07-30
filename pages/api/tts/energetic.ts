import { NextApiRequest, NextApiResponse } from 'next';
import { getEnergeticVoiceGenerator, EnergeticEmotion } from '../../../lib/energetic-voice-generator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // OPTIONS 요청 처리 (CORS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // GET 요청 - API 정보 제공
  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Energetic Voice Generator',
      version: '1.0.0',
      description: '밝고 활기찬 한국어 음성 생성 API',
      endpoints: {
        POST: {
          description: '활기찬 음성 생성',
          parameters: {
            text: 'string (required) - 변환할 텍스트',
            emotion: 'string (optional) - excited, motivated, enthusiastic, cheerful, celebratory',
            gender: 'string (optional) - male, female, auto',
            intensity: 'string (optional) - low, medium, high',
            videoType: 'string (optional) - advertisement, tutorial, motivation, celebration'
          }
        }
      },
      emotions: [
        { value: 'excited', description: '신나고 기쁜 감정' },
        { value: 'motivated', description: '동기부여와 격려' },
        { value: 'enthusiastic', description: '열정적이고 흥분된' },
        { value: 'cheerful', description: '명랑하고 밝은' },
        { value: 'celebratory', description: '축하와 기쁨' }
      ]
    });
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // 요청 본문 검증
    const { 
      text, 
      emotion = 'excited', 
      gender,
      intensity = 'medium',
      videoType
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '텍스트는 필수 입력값입니다.'
      });
    }

    // 감정 유효성 검사
    const validEmotions: EnergeticEmotion[] = [
      'excited', 'motivated', 'enthusiastic', 'cheerful', 'celebratory'
    ];
    if (!validEmotions.includes(emotion as EnergeticEmotion)) {
      return res.status(400).json({
        success: false,
        error: `감정은 다음 중 하나여야 합니다: ${validEmotions.join(', ')}`
      });
    }

    // 성별 유효성 검사
    if (gender && !['male', 'female', 'auto'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: '성별은 male, female, auto 중 하나여야 합니다.'
      });
    }

    // 강도 유효성 검사
    if (intensity && !['low', 'medium', 'high'].includes(intensity)) {
      return res.status(400).json({
        success: false,
        error: '강도는 low, medium, high 중 하나여야 합니다.'
      });
    }

    // 활기찬 음성 생성기 초기화
    const generator = getEnergeticVoiceGenerator();
    
    if (!generator) {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs API가 구성되지 않았습니다. ELEVENLABS_API_KEY를 설정하세요.'
      });
    }

    let result;

    // videoType이 지정된 경우 해당 타입에 맞는 설정 사용
    if (videoType && ['advertisement', 'tutorial', 'motivation', 'celebration'].includes(videoType)) {
      result = await generator.generateForVideoType(text, videoType as any);
    } else {
      // 일반 활기찬 음성 생성
      result = await generator.generateEnergeticVoice(text, {
        emotion: emotion as EnergeticEmotion,
        gender: gender as 'male' | 'female' | 'auto',
        intensity: intensity as 'low' | 'medium' | 'high'
      });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          audioUrl: result.audioUrl,
          duration: result.duration,
          voiceUsed: result.voiceUsed,
          emotion: emotion,
          intensity: intensity,
          processedAt: new Date().toISOString()
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || '음성 생성 중 오류가 발생했습니다.'
      });
    }

  } catch (error: any) {
    console.error('Energetic Voice API 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}

// API 라우트 설정
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};