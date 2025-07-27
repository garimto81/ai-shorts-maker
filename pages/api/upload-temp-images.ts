// API 엔드포인트: 임시 이미지 파일 업로드 (v1.6.1)

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import path from 'path';

// 파일 업로드 설정
export const config = {
  api: {
    bodyParser: false, // formidable을 사용하므로 기본 bodyParser 비활성화
  },
};

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
    // 임시 업로드 디렉토리 생성
    const tempUploadDir = path.join(process.cwd(), 'public', 'temp-uploads');
    if (!fs.existsSync(tempUploadDir)) {
      fs.mkdirSync(tempUploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: tempUploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 20, // 최대 20개 파일
    });

    const { files } = await new Promise<{ files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ files });
      });
    });

    console.log('📁 임시 이미지 업로드 요청:', {
      fileCount: Array.isArray(files.images) ? files.images.length : (files.images ? 1 : 0)
    });

    // 업로드된 파일들 처리
    const uploadedImages: string[] = [];
    const imageFiles = Array.isArray(files.images) ? files.images : (files.images ? [files.images] : []);
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i] as FormidableFile;
      
      if (!file || !file.filepath) {
        console.warn(`파일 ${i + 1} 처리 실패: 파일 정보 없음`);
        continue;
      }

      // 파일 확장자 확인
      const ext = path.extname(file.originalFilename || '').toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
        console.warn(`지원하지 않는 파일 형식: ${ext}`);
        continue;
      }

      // 안전한 파일명 생성
      const timestamp = Date.now();
      const safeFileName = `temp_${timestamp}_${i + 1}${ext}`;
      const finalPath = path.join(tempUploadDir, safeFileName);
      
      // 파일 이동
      fs.renameSync(file.filepath, finalPath);
      
      // 웹 접근 가능한 경로로 변환
      const webPath = `/temp-uploads/${safeFileName}`;
      uploadedImages.push(webPath);
      
      console.log(`✅ 파일 업로드 완료: ${safeFileName}`);
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: '업로드된 이미지가 없습니다.'
      });
    }

    console.log('✅ 임시 이미지 업로드 완료:', {
      count: uploadedImages.length,
      paths: uploadedImages
    });

    return res.status(200).json({
      success: true,
      data: {
        imagePaths: uploadedImages,
        count: uploadedImages.length
      },
      message: '이미지가 성공적으로 업로드되었습니다.'
    });

  } catch (error: any) {
    console.error('❌ 임시 이미지 업로드 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '이미지 업로드 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}