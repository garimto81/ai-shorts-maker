// 테스트용 샘플 이미지 생성 API

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST 방식만 지원됩니다' 
    });
  }

  const startTime = Date.now();
  const { count = 5 } = req.body;

  try {
    console.log(`📁 테스트용 샘플 이미지 ${count}개 생성 시작`);

    // 샘플 이미지 디렉토리 생성
    const sampleDir = path.join(process.cwd(), 'public', 'test-samples');
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }

    const imageUrls: string[] = [];
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    // SVG 기반 테스트 이미지 생성
    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const imageNumber = i + 1;
      
      // 1080x1920 세로형 이미지 (쇼츠 형식)
      const svgContent = `
        <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- 배경 -->
          <rect width="1080" height="1920" fill="url(#grad${i})" />
          
          <!-- 중앙 원 -->
          <circle cx="540" cy="960" r="200" fill="rgba(255,255,255,0.2)" />
          <circle cx="540" cy="960" r="150" fill="rgba(255,255,255,0.3)" />
          
          <!-- 이미지 번호 -->
          <text x="540" y="980" font-family="Arial, sans-serif" font-size="120" 
                font-weight="bold" text-anchor="middle" fill="white">
            ${imageNumber}
          </text>
          
          <!-- 제목 -->
          <text x="540" y="1200" font-family="Arial, sans-serif" font-size="48" 
                font-weight="bold" text-anchor="middle" fill="white">
            테스트 이미지 ${imageNumber}
          </text>
          
          <!-- 설명 -->
          <text x="540" y="1280" font-family="Arial, sans-serif" font-size="32" 
                text-anchor="middle" fill="rgba(255,255,255,0.8)">
            AI 쇼츠 메이커 테스트용
          </text>
          
          <!-- 하단 패턴 -->
          <rect x="0" y="1700" width="1080" height="220" fill="rgba(0,0,0,0.3)" />
          <text x="540" y="1820" font-family="Arial, sans-serif" font-size="28" 
                text-anchor="middle" fill="white">
            해상도: 1080x1920 | 형식: 세로형 쇼츠
          </text>
        </svg>
      `;

      const filename = `test-sample-${imageNumber}.svg`;
      const filepath = path.join(sampleDir, filename);
      
      fs.writeFileSync(filepath, svgContent);
      imageUrls.push(`/test-samples/${filename}`);
      
      console.log(`✅ 샘플 이미지 생성: ${filename}`);
    }

    const processingTime = Date.now() - startTime;

    console.log(`🎉 샘플 이미지 생성 완료: ${count}개 (${processingTime}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        images: imageUrls,
        count: imageUrls.length,
        directory: '/test-samples',
        resolution: '1080x1920',
        format: 'SVG'
      },
      message: `테스트용 샘플 이미지 ${count}개가 생성되었습니다.`,
      processingTime
    });

  } catch (error: any) {
    console.error('❌ 샘플 이미지 생성 실패:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '샘플 이미지 생성 중 오류가 발생했습니다.',
      processingTime: Date.now() - startTime
    });
  }
}

// 색상 밝기 조절 함수
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}