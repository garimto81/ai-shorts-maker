import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTestImage(index) {
    // 간단한 테스트 이미지 생성 (Base64)
    const colors = ['FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF'];
    const color = colors[index % colors.length];
    
    // 1x1 컬러 픽셀 PNG (매우 작은 크기)
    const pngData = Buffer.from(`89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C62${color}00000600040052B5F4950000000049454E44AE426082`, 'hex');
    
    return `data:image/png;base64,${pngData.toString('base64')}`;
}

async function testGeneration() {
    console.log('🚀 쇼츠 생성 테스트 시작...\n');
    
    try {
        // 테스트 이미지 3개 생성
        const images = [];
        for (let i = 0; i < 3; i++) {
            images.push(await createTestImage(i));
        }
        
        // FormData 생성
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        
        // 이미지를 Blob으로 변환하여 추가
        for (let i = 0; i < images.length; i++) {
            const base64Data = images[i].split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            form.append('images', buffer, {
                filename: `test${i}.png`,
                contentType: 'image/png'
            });
        }
        
        form.append('productName', '테스트 상품 (갤럭시 S24)');
        form.append('style', 'dynamic');
        form.append('industry', 'tech');
        
        console.log('📤 서버에 요청 전송 중...');
        
        // API 호출
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 생성 성공!');
            console.log('\n📊 결과:');
            console.log('- 상품명:', result.data.productName);
            console.log('- 스타일:', result.data.style);
            console.log('- 이미지 수:', result.data.imagePaths.length);
            console.log('- 비디오 경로:', result.data.videoPath);
            console.log('\n📝 분석 결과:');
            console.log(JSON.stringify(result.data.analysis, null, 2));
            console.log('\n🎬 스크립트:');
            console.log(JSON.stringify(result.data.script, null, 2));
        } else {
            console.error('❌ 생성 실패:', result.error);
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류:', error.message);
        console.error(error.stack);
    }
}

// node-fetch 설치 확인
async function checkDependencies() {
    try {
        await import('node-fetch');
        await import('form-data');
        return true;
    } catch {
        console.log('📦 필요한 패키지 설치 중...');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execPromise = promisify(exec);
        
        await execPromise('npm install node-fetch form-data');
        console.log('✅ 패키지 설치 완료\n');
        return true;
    }
}

// 실행
checkDependencies().then(() => {
    testGeneration();
});