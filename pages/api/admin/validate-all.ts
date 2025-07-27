// API: 모든 API 키 일괄 검증

import { NextApiRequest, NextApiResponse } from 'next';
import { validateAllApiKeys } from '@/lib/api-validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = await validateAllApiKeys();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
}