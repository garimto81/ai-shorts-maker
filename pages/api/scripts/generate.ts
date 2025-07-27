// AI 스크립트 생성 API

import { NextApiRequest, NextApiResponse } from 'next';
import { geminiScriptGenerator } from '@/lib/gemini-script-generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const {
      topic,
      category,
      targetDuration,
      style,
      audience,
      sampleScriptIds,
      templateId,
      customPrompts,
      imageAnalysis
    } = req.body;
    
    // 필수 필드 검증
    if (!topic || !category) {
      return res.status(400).json({ 
        error: '필수 필드가 누락되었습니다',
        required: ['topic', 'category']
      });
    }
    
    // 요청 객체 구성
    const generationRequest = {
      topic,
      category,
      targetDuration: targetDuration || 30,
      style: style || 'casual',
      audience: audience || 'general',
      sampleScriptIds: sampleScriptIds || [],
      templateId,
      customPrompts,
      imageAnalysis
    };
    
    console.log('🎬 스크립트 생성 요청:', {
      topic,
      category,
      targetDuration: generationRequest.targetDuration,
      sampleCount: generationRequest.sampleScriptIds.length
    });
    
    // Gemini AI로 스크립트 생성
    const generatedScript = await geminiScriptGenerator.generateScript(generationRequest);
    
    res.status(200).json({
      success: true,
      script: generatedScript,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: `${Date.now() - Date.now()}ms`,
        basedOnSamples: generationRequest.sampleScriptIds.length,
        aiConfidence: generatedScript.metadata.aiConfidence,
        estimatedQuality: generatedScript.metadata.estimatedQuality
      }
    });
    
  } catch (error: any) {
    console.error('스크립트 생성 API 오류:', error);
    
    // Gemini API 관련 오류 처리
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'Gemini API 키 설정을 확인해주세요',
        details: 'GEMINI_API_KEY 환경 변수가 올바르게 설정되었는지 확인하세요.'
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'API 사용량 한도를 초과했습니다',
        details: '잠시 후 다시 시도해주세요.'
      });
    }
    
    res.status(500).json({ 
      error: '스크립트 생성 중 오류가 발생했습니다',
      message: error.message
    });
  }
}