// 샘플 스크립트 관리 API

import { NextApiRequest, NextApiResponse } from 'next';
import { scriptDatabase } from '@/lib/script-database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('스크립트 API 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다',
      message: error.message 
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { category, search, tags } = req.query;
  
  try {
    let scripts;
    
    if (search || tags) {
      // 검색 또는 태그 필터링
      const tagArray = tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined;
      scripts = await scriptDatabase.searchScripts(search as string || '', tagArray);
    } else if (category && category !== 'all') {
      // 카테고리 필터링
      scripts = await scriptDatabase.getScriptsByCategory(category as any);
    } else {
      // 전체 조회
      scripts = await scriptDatabase.getAllScripts();
    }
    
    // 활성화된 스크립트만 반환
    const activeScripts = scripts.filter(script => script.metadata.isActive);
    
    res.status(200).json(activeScripts);
  } catch (error) {
    console.error('스크립트 조회 오류:', error);
    res.status(500).json({ error: '스크립트 조회 실패' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    title,
    description,
    category,
    tags,
    content,
    aiPrompts
  } = req.body;
  
  // 필수 필드 검증
  if (!title || !description || !category || !content?.narration) {
    return res.status(400).json({ 
      error: '필수 필드가 누락되었습니다',
      required: ['title', 'description', 'category', 'content.narration']
    });
  }
  
  try {
    const newScript = await scriptDatabase.createScript({
      title,
      description,
      category,
      tags: tags || [],
      content: {
        narration: content.narration,
        scenes: content.scenes || [],
        timing: content.timing || {
          totalDuration: 30,
          introLength: 6,
          mainLength: 18,
          outroLength: 6
        }
      },
      aiPrompts: {
        stylePrompt: aiPrompts?.stylePrompt || '',
        structurePrompt: aiPrompts?.structurePrompt || '',
        tonePrompt: aiPrompts?.tonePrompt || ''
      }
    });
    
    res.status(201).json({
      success: true,
      script: newScript,
      message: '스크립트가 성공적으로 등록되었습니다'
    });
  } catch (error) {
    console.error('스크립트 생성 오류:', error);
    res.status(500).json({ error: '스크립트 생성 실패' });
  }
}