// API: 파일 정렬 엔드포인트

import { NextApiRequest, NextApiResponse } from 'next';
import { intelligentFileSorter } from '@/lib/intelligent-file-sorter';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Next.js body parser 비활성화 (파일 업로드용)
export const config = {
  api: {
    bodyParser: false,
  },
};

// 서버사이드에서 File 객체 생성을 위한 폴리필
class ServerFile {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;

  constructor(buffer: Buffer, name: string, type: string) {
    this.name = name;
    this.type = type;
    this.size = buffer.length;
    this.buffer = buffer;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // formidable로 파일 파싱
    const form = formidable({
      maxFiles: 20,
      maxFileSize: 10 * 1024 * 1024, // 10MB per file
      filter: ({ mimetype }) => {
        return Boolean(mimetype && mimetype.includes('image'));
      }
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.images || files.images.length === 0) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다' });
    }

    // ServerFile 객체로 변환
    const imageFiles: any[] = [];
    const fileArray = Array.isArray(files.images) ? files.images : [files.images];
    
    for (const file of fileArray) {
      const buffer = fs.readFileSync(file.filepath);
      const serverFile = new ServerFile(
        buffer, 
        file.originalFilename || 'unknown.jpg',
        file.mimetype || 'image/jpeg'
      );
      imageFiles.push(serverFile);
    }

    console.log(`📤 ${imageFiles.length}개 파일 정렬 요청 접수`);

    // 지능형 파일 정렬 실행
    const result = await intelligentFileSorter.sortFiles(imageFiles);

    // 임시 파일 정리
    fileArray.forEach(file => {
      try {
        fs.unlinkSync(file.filepath);
      } catch (error) {
        console.warn('임시 파일 삭제 실패:', file.filepath);
      }
    });

    // 결과 반환
    res.json({
      success: true,
      data: {
        sortedFiles: result.sortedFiles.map(sf => ({
          filename: sf.file.name,
          originalIndex: sf.originalIndex,
          finalIndex: sf.finalIndex,
          confidence: sf.confidence,
          sortingReasons: sf.sortingReasons,
          metadata: {
            extractedDate: sf.metadata.extractedDate?.toISOString(),
            pattern: sf.metadata.pattern,
            confidence: sf.metadata.confidence
          },
          imageAnalysis: sf.imageAnalysis ? {
            scene: sf.imageAnalysis.analysis.scene,
            timeOfDay: sf.imageAnalysis.analysis.timeOfDay,
            setting: sf.imageAnalysis.analysis.setting,
            sequenceHints: sf.imageAnalysis.sequenceHints,
            confidence: sf.imageAnalysis.confidence
          } : null
        })),
        report: result.report
      }
    });

  } catch (error: any) {
    console.error('파일 정렬 API 오류:', error);
    res.status(500).json({ 
      error: '파일 정렬 중 오류가 발생했습니다',
      message: error.message 
    });
  }
}