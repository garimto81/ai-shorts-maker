// API 엔드포인트: Gemini TTS 음성 생성 (v1.5.0)

import { NextApiRequest, NextApiResponse } from 'next';
import { geminiTTS, TTSRequest } from '@/lib/gemini-tts';
import { z } from 'zod';

// 요청 데이터 검증 스키마
const ttsRequestSchema = z.object({
  text: z.string().min(1, '변환할 텍스트가 필요합니다').max(5000, '텍스트는 5000자를 초과할 수 없습니다'),
  voice: z.string().optional(),
  speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
  style: z.enum(['neutral', 'cheerful', 'calm', 'excited', 'professional']).default('neutral'),
  language: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
  format: z.enum(['wav', 'mp3']).default('wav')
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 한글 인코딩 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. POST 요청만 지원됩니다.' 
    });
  }

  try {
    // 요청 데이터 검증
    const validatedData = ttsRequestSchema.parse(req.body);
    
    console.log('🎙️ TTS 음성 생성 요청:', {
      textLength: validatedData.text.length,
      voice: validatedData.voice || '기본값',
      speed: validatedData.speed,
      style: validatedData.style,
      language: validatedData.language
    });

    // 입력 텍스트 전처리
    const processedText = preprocessText(validatedData.text);
    
    // TTS 요청 구성
    const ttsRequest: TTSRequest = {
      text: processedText,
      voice: validatedData.voice,
      speed: validatedData.speed,
      style: validatedData.style,
      language: validatedData.language
    };

    // Gemini TTS 엔진으로 음성 생성
    const startTime = Date.now();
    const result = await geminiTTS.textToSpeech(ttsRequest);
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'TTS 변환에 실패했습니다.',
        processingTime
      });
    }

    console.log('✅ TTS 음성 생성 완료:', {
      duration: result.duration + '초',
      fileSize: result.audioBuffer ? Math.round(result.audioBuffer.length / 1024) + 'KB' : 'N/A',
      processingTime: processingTime + 'ms',
      audioPath: result.audioPath
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: {
        audioUrl: result.audioPath,
        duration: result.duration,
        format: result.format,
        sampleRate: result.sampleRate,
        channels: result.channels,
        textLength: validatedData.text.length,
        voice: validatedData.voice || '기본값',
        style: validatedData.style,
        language: validatedData.language
      },
      message: '음성이 성공적으로 생성되었습니다.',
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime,
        engine: 'Gemini 2.5 TTS',
        version: '1.5.0'
      }
    });

  } catch (error: any) {
    console.error('❌ TTS API 오류:', error);
    
    // Zod 검증 오류 처리
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      return res.status(400).json({
        success: false,
        error: '입력 데이터가 올바르지 않습니다.',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'TTS 음성 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: 'TTS_GENERATION_ERROR'
    });
  }
}

/**
 * 텍스트 전처리 함수
 */
function preprocessText(text: string): string {
  return text
    // 연속된 공백 제거
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 제거
    .trim()
    // 특수 문자 처리 (읽기 어려운 문자들)
    .replace(/[^\w\s가-힣.,!?;:()\-""'']/g, '')
    // 연속된 문장부호 정리
    .replace(/[.]{2,}/g, '.')
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    // 숫자를 한글로 변환 (간단한 경우만)
    .replace(/\b(\d+)\b/g, (match, num) => {
      const number = parseInt(num);
      if (number <= 10) {
        const koreanNumbers = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
        return koreanNumbers[number] || num;
      }
      return num;
    });
}

// API 설정 (파일 업로드 비활성화)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 큰 텍스트도 처리 가능
    },
  },
};