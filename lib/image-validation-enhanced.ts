// 강화된 이미지 파일 검증 로직
import fs from 'fs';
import path from 'path';
import sharp from 'sharp'; // 이미지 처리 라이브러리

export interface ImageValidationResult {
  success: boolean;
  validImages: string[];
  invalidImages: string[];
  errors: string[];
  totalSize: number;
}

export async function validateAndProcessImages(
  imagePaths: string[],
  targetWidth: number,
  targetHeight: number
): Promise<ImageValidationResult> {
  
  const result: ImageValidationResult = {
    success: false,
    validImages: [],
    invalidImages: [],
    errors: [],
    totalSize: 0
  };

  console.log('🔍 이미지 검증 시작:', {
    총이미지수: imagePaths.length,
    타겟해상도: `${targetWidth}x${targetHeight}`
  });

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    
    try {
      // 1. 파일 존재 확인 (public 폴더 기준 경로 처리)
      let fullPath = imagePath;
      
      // 웹 경로 (슬래시로 시작)를 파일 시스템 경로로 변환
      if (imagePath.startsWith('/')) {
        fullPath = path.join(process.cwd(), 'public', imagePath.substring(1));
      } else if (!path.isAbsolute(imagePath)) {
        fullPath = path.join(process.cwd(), 'public', imagePath);
      }
      
      if (!fs.existsSync(fullPath)) {
        result.invalidImages.push(imagePath);
        result.errors.push(`파일이 존재하지 않음: ${imagePath}`);
        console.log(`❌ 파일 없음: ${fullPath}`);
        continue;
      }

      // 2. 파일 크기 확인
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        result.invalidImages.push(imagePath);
        result.errors.push(`빈 파일: ${imagePath}`);
        continue;
      }

      // 3. 파일 확장자 확인
      const ext = path.extname(imagePath).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
        result.invalidImages.push(imagePath);
        result.errors.push(`지원하지 않는 형식: ${imagePath} (${ext})`);
        continue;
      }

      // 4. 이미지 메타데이터 확인 (Sharp 사용)
      try {
        const metadata = await sharp(fullPath).metadata();
        
        if (!metadata.width || !metadata.height) {
          result.invalidImages.push(imagePath);
          result.errors.push(`이미지 정보를 읽을 수 없음: ${imagePath}`);
          continue;
        }

        console.log(`📸 이미지 ${i+1}: ${metadata.width}x${metadata.height}, ${Math.round(stats.size/1024)}KB`);
        
        result.validImages.push(fullPath); // 전체 경로를 저장
        result.totalSize += stats.size;

      } catch (sharpError) {
        result.invalidImages.push(imagePath);
        result.errors.push(`이미지 처리 오류: ${imagePath} - ${sharpError}`);
        continue;
      }

    } catch (error: any) {
      result.invalidImages.push(imagePath);
      result.errors.push(`검증 오류: ${imagePath} - ${error.message}`);
    }
  }

  result.success = result.validImages.length > 0;
  
  console.log('✅ 이미지 검증 완료:', {
    유효한이미지: result.validImages.length,
    무효한이미지: result.invalidImages.length,
    총용량: Math.round(result.totalSize / 1024 / 1024) + 'MB'
  });

  if (result.errors.length > 0) {
    console.warn('⚠️ 검증 오류들:', result.errors);
  }

  return result;
}

/**
 * 이미지들을 표준 크기로 리사이즈 및 최적화
 */
export async function processAndOptimizeImages(
  imagePaths: string[],
  outputDir: string,
  targetWidth: number,
  targetHeight: number
): Promise<string[]> {
  
  const processedImages: string[] = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    const filename = `processed_image_${String(i + 1).padStart(4, '0')}.jpg`;
    const outputPath = path.join(outputDir, filename);
    
    try {
      await sharp(imagePath)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 } // 검은색 배경
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toFile(outputPath);
      
      processedImages.push(outputPath);
      console.log(`🎨 이미지 처리 완료: ${filename}`);
      
    } catch (error: any) {
      console.error(`❌ 이미지 처리 실패: ${imagePath} - ${error.message}`);
      throw new Error(`이미지 처리 실패: ${error.message}`);
    }
  }
  
  return processedImages;
}