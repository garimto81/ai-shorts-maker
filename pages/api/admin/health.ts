// API: 시스템 건강 상태 확인

import { NextApiRequest, NextApiResponse } from 'next';
import { healthCheck } from '@/lib/api-validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await healthCheck();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
}