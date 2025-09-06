import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Gemini API 테스트 시작 ===\n');

// API 키 확인
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
    console.log('📝 .env 파일에 다음과 같이 추가하세요:');
    console.log('GEMINI_API_KEY=your_api_key_here\n');
    process.exit(1);
}

console.log('✅ API 키 감지됨:', apiKey.substring(0, 10) + '...');

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(apiKey);

async function testBasicText() {
    console.log('\n📝 텍스트 생성 테스트...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = "10초 쇼츠 영상을 위한 간단한 스크립트를 작성해주세요. 제품: 테스트 상품";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ 텍스트 생성 성공!');
        console.log('응답 길이:', text.length, '자');
        console.log('응답 미리보기:', text.substring(0, 100) + '...\n');
        return true;
    } catch (error) {
        console.error('❌ 텍스트 생성 실패:', error.message);
        return false;
    }
}

async function testImageAnalysis() {
    console.log('🖼️ 이미지 분석 테스트...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // 테스트용 이미지 (1x1 픽셀 투명 PNG)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const prompt = "이 이미지를 간단히 설명해주세요.";
        const imagePart = {
            inlineData: {
                data: testImageBase64,
                mimeType: 'image/png'
            }
        };
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ 이미지 분석 성공!');
        console.log('응답:', text.substring(0, 100), '...\n');
        return true;
    } catch (error) {
        console.error('❌ 이미지 분석 실패:', error.message);
        return false;
    }
}

async function testShortsGeneration() {
    console.log('🎬 쇼츠 스크립트 생성 테스트...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            10초 쇼츠 영상을 위한 스크립트를 JSON 형식으로 작성해주세요.
            
            제품: 갤럭시 S24
            스타일: dynamic
            
            구조:
            - 0-2초: 훅
            - 2-4초: 문제 제시
            - 4-6초: 제품 소개
            - 6-8초: 혜택
            - 8-10초: CTA
            
            각 구간별로 narration, caption, visualDirection을 포함해주세요.
            JSON 형식으로만 응답해주세요.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ 스크립트 생성 성공!');
        
        // JSON 파싱 시도
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const script = JSON.parse(jsonMatch[0]);
                console.log('✅ JSON 파싱 성공!');
                console.log('스크립트 구조:', Object.keys(script));
            }
        } catch (e) {
            console.log('⚠️ JSON 파싱 실패, 텍스트로 처리 가능');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 스크립트 생성 실패:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 모든 테스트 실행 중...\n');
    
    const tests = [
        { name: '기본 텍스트 생성', fn: testBasicText },
        { name: '이미지 분석', fn: testImageAnalysis },
        { name: '쇼츠 스크립트 생성', fn: testShortsGeneration }
    ];
    
    const results = [];
    
    for (const test of tests) {
        console.log(`\n=== ${test.name} ===`);
        const success = await test.fn();
        results.push({ name: test.name, success });
        
        // API 할당량 제한 방지를 위한 대기
        if (tests.indexOf(test) < tests.length - 1) {
            console.log('⏳ 다음 테스트까지 2초 대기...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n=== 테스트 결과 요약 ===');
    results.forEach(r => {
        console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n총 ${results.length}개 중 ${successCount}개 성공`);
    
    if (successCount === results.length) {
        console.log('\n🎉 모든 테스트 통과! Gemini API가 정상 작동합니다.');
    } else {
        console.log('\n⚠️ 일부 테스트 실패. API 키와 네트워크를 확인하세요.');
    }
}

// 테스트 실행
runAllTests().catch(console.error);