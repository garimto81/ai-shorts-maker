import fetch from 'node-fetch';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTestImage() {
    console.log('📸 실제 이미지 생성 중...');
    
    // 더 큰 테스트 이미지 생성 (500x500)
    const width = 500;
    const height = 500;
    
    // Sharp로 그라데이션 이미지 생성
    const svgImage = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(255,100,100);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(100,100,255);stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad1)" />
            <rect x="100" y="100" width="300" height="300" fill="white" opacity="0.9" rx="20"/>
            <text x="250" y="220" font-family="Arial" font-size="40" font-weight="bold" text-anchor="middle" fill="#333">테스트 상품</text>
            <text x="250" y="270" font-family="Arial" font-size="25" text-anchor="middle" fill="#666">Premium Quality</text>
            <circle cx="250" cy="330" r="40" fill="#4CAF50"/>
            <text x="250" y="340" font-family="Arial" font-size="30" font-weight="bold" text-anchor="middle" fill="white">NEW</text>
        </svg>
    `;
    
    const buffer = Buffer.from(svgImage);
    const imageBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    
    const testImagePath = path.join(__dirname, 'test-product.jpg');
    await fs.promises.writeFile(testImagePath, imageBuffer);
    
    console.log('✅ 테스트 이미지 생성 완료:', testImagePath);
    return testImagePath;
}

async function testAnalyzeAPI() {
    try {
        // 1. 테스트 이미지 생성
        const imagePath = await createTestImage();
        
        // 2. 이미지를 읽어서 FormData 생성
        const imageBuffer = await fs.promises.readFile(imagePath);
        
        // 3. FormData 생성 (node-fetch용)
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('image', imageBuffer, {
            filename: 'test-product.jpg',
            contentType: 'image/jpeg'
        });
        
        console.log('\n🚀 API 호출 중...');
        
        // 4. API 호출
        const response = await fetch('http://localhost:3000/api/analyze-image', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('\n✅ 캡션 생성 성공!');
            console.log('━'.repeat(50));
            console.log('생성된 한줄평:', result.analysis);
            console.log('━'.repeat(50));
        } else {
            console.error('\n❌ 오류:', result.error);
            if (result.details) {
                console.error('상세:', result.details);
            }
        }
        
        // 5. 테스트 이미지 삭제
        await fs.promises.unlink(imagePath);
        console.log('\n🧹 테스트 이미지 삭제 완료');
        
    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
        console.error(error.stack);
    }
}

// 실행
console.log('=' .repeat(50));
console.log('🎬 이미지 캡션 API 테스트 시작');
console.log('=' .repeat(50));

testAnalyzeAPI();