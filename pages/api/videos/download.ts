// 렌더링된 비디오 파일 다운로드 API

import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 방식만 지원됩니다' });
  }

  try {
    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: '파일 경로가 필요합니다' });
    }

    // 보안: 파일 경로 검증
    const normalizedPath = path.normalize(filePath);
    const publicVideosDir = path.join(process.cwd(), 'public', 'videos');
    
    if (!normalizedPath.startsWith(publicVideosDir)) {
      return res.status(403).json({ error: '접근 권한이 없습니다' });
    }

    // 파일 존재 확인
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다' });
    }

    // 파일 정보
    const stats = fs.statSync(normalizedPath);
    const fileName = path.basename(normalizedPath);
    
    // MIME 타입 결정
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // 응답 헤더 설정
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // 파일 스트리밍
    const fileStream = fs.createReadStream(normalizedPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('파일 스트리밍 오류:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: '파일 전송 중 오류가 발생했습니다' });
      }
    });

    fileStream.on('end', () => {
      console.log('✅ 파일 다운로드 완료:', fileName);
    });

  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    });
  }
}