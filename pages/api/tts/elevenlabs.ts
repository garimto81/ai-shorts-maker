// API 엔드포인트: ElevenLabs TTS 전용
// 가장 자연스러운 음성 생성을 위한 엔드포인트

import { NextApiRequest, NextApiResponse } from 'next';
import { getElevenLabsTTS } from '@/lib/elevenlabs-tts';
import { z } from 'zod';

// 요청 데이터 검증 스키마
const elevenLabsRequestSchema = z.object({
  text: z.string().min(1, '텍스트가 필요합니다').max(5000, '텍스트는 5000자를 초과할 수 없습니다'),
  voice_id: z.string().optional(),
  model_id: z.string().optional().default('eleven_multilingual_v2'),
  voice_settings: z.object({
    stability: z.number().min(0).max(1).optional().default(0.75),
    similarity_boost: z.number().min(0).max(1).optional().default(0.75),
    style: z.number().min(0).max(1).optional().default(0.5),
    use_speaker_boost: z.boolean().optional().default(true)
  }).optional(),
  video_type: z.enum(['auto_repair', 'tutorial', 'advertisement', 'narration', 'educational']).optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. POST 요청만 지원됩니다.' 
    });
  }

  try {
    // ElevenLabs 인스턴스 확인
    const elevenLabs = getElevenLabsTTS();
    if (!elevenLabs) {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs API가 구성되지 않았습니다. ELEVENLABS_API_KEY를 설정해주세요.',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // 요청 데이터 검증
    const validatedData = elevenLabsRequestSchema.parse(req.body);
    
    console.log('🎙️ ElevenLabs TTS 요청:', {
      textLength: validatedData.text.length,
      voice_id: validatedData.voice_id || '기본값',
      video_type: validatedData.video_type
    });

    // 비디오 타입에 따른 설정 가져오기
    let options = {
      voice_id: validatedData.voice_id,
      model_id: validatedData.model_id,
      voice_settings: validatedData.voice_settings
    };

    if (validatedData.video_type && !validatedData.voice_id) {
      const recommendedSettings = elevenLabs.getRecommendedSettings(validatedData.video_type);
      options = { ...options, ...recommendedSettings } as any;
    }

    // TTS 생성
    const startTime = Date.now();
    const result = await elevenLabs.textToSpeech(validatedData.text, options);
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'TTS 변환에 실패했습니다.',
        processingTime
      });
    }

    console.log('✅ ElevenLabs TTS 완료:', {
      duration: result.duration + '초',
      processingTime: processingTime + 'ms',
      audioPath: result.audioPath
    });

    // 사용량 확인 (옵션)
    let usage = null;
    try {
      usage = await elevenLabs.getUsage();
    } catch (e) {
      console.warn('사용량 조회 실패:', e);
    }

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: {
        audioUrl: result.audioPath,
        duration: result.duration,
        format: 'mp3',
        textLength: validatedData.text.length,
        voice_id: options.voice_id || 'default',
        model_id: options.model_id
      },
      message: 'ElevenLabs로 자연스러운 음성이 생성되었습니다.',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime,
        engine: 'ElevenLabs',
        version: 'v1',
        usage: usage ? {
          used: usage.character_count,
          limit: usage.character_limit,
          remaining: usage.remaining_characters
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ ElevenLabs API 오류:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        code: 'VALIDATION_ERROR'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'TTS 음성 생성 중 오류가 발생했습니다.',
      code: 'TTS_GENERATION_ERROR'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};