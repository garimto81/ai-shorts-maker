// API: 개별 API 키 검증 (Gemini 통합 아키텍처)

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  validateGeminiKey
} from '@/lib/api-validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { service, apiKey } = req.body;

  if (!service || !apiKey) {
    return res.status(400).json({ 
      error: 'service와 apiKey가 필요합니다' 
    });
  }

  try {
    let result;

    switch (service) {
      case 'gemini':
        result = await validateGeminiKey(apiKey);
        break;
      case 'azure':
        result = {
          service: 'azure-speech',
          valid: false,
          error: 'v1.4.0에서 제거됨 - Gemini TTS로 대체',
          optional: true
        };
        break;
      case 'openai':
        result = {
          service: 'openai',
          valid: false,
          error: 'v1.4.0에서 제거됨 - Gemini AI로 통일',
          optional: true
        };
        break;
      default:
        return res.status(400).json({ 
          error: '지원하지 않는 서비스입니다. v1.4.0에서는 Gemini만 지원합니다.' 
        });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
}