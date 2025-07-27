// 개별 스크립트 관리 API

import { NextApiRequest, NextApiResponse } from 'next';
import { scriptDatabase } from '@/lib/script-database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '유효하지 않은 스크립트 ID입니다' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, id);
        break;
      case 'PUT':
        await handlePut(req, res, id);
        break;
      case 'DELETE':
        await handleDelete(req, res, id);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const script = await scriptDatabase.getScriptById(id);
    
    if (!script) {
      return res.status(404).json({ error: '스크립트를 찾을 수 없습니다' });
    }
    
    res.status(200).json(script);
  } catch (error) {
    console.error('스크립트 조회 오류:', error);
    res.status(500).json({ error: '스크립트 조회 실패' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const updates = req.body;
    
    const updatedScript = await scriptDatabase.updateScript(id, updates);
    
    if (!updatedScript) {
      return res.status(404).json({ error: '스크립트를 찾을 수 없습니다' });
    }
    
    res.status(200).json({
      success: true,
      script: updatedScript,
      message: '스크립트가 성공적으로 업데이트되었습니다'
    });
  } catch (error) {
    console.error('스크립트 업데이트 오류:', error);
    res.status(500).json({ error: '스크립트 업데이트 실패' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const deleted = await scriptDatabase.deleteScript(id);
    
    if (!deleted) {
      return res.status(404).json({ error: '스크립트를 찾을 수 없습니다' });
    }
    
    res.status(200).json({
      success: true,
      message: '스크립트가 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('스크립트 삭제 오류:', error);
    res.status(500).json({ error: '스크립트 삭제 실패' });
  }
}