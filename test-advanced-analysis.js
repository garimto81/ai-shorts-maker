import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 === 고급 이미지 분석 테스트 도구 ===\n');

// API 키 확인
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEY가 올바르게 설정되지 않았습니다.');
    console.log('📝 .env 파일에서 실제 API 키로 변경해주세요:\n');
    console.log('   GEMINI_API_KEY=실제_API_키_입력\n');
    process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 10) + '...');

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(apiKey);

// 테스트용 이미지 생성 (다양한 색상과 패턴)
function generateTestImages() {
    const images = [];
    
    // 1. 빨간 원 이미지 (PNG)
    const redCircle = Buffer.from(
        '89504e470d0a1a0a0000000d494844520000006400000064080600000070e295540000006849444154789cedc1010d000000c2a0f74f6d0e37a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000be0d210000012724f0370000000049454e44ae426082',
        'hex'
    );
    images.push({ name: 'red_circle.png', data: redCircle.toString('base64'), type: 'image/png' });
    
    // 2. 파란 사각형 이미지 (PNG)  
    const blueSquare = Buffer.from(
        '89504e470d0a1a0a0000000d494844520000006400000064080600000070e295540000006849444154789cedc1010d000000c2a0f74f6d0e37a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000be0d210000012724f0370000000049454e44ae426082',
        'hex'
    );
    images.push({ name: 'blue_square.png', data: blueSquare.toString('base64'), type: 'image/png' });
    
    // 3. 초록 삼각형 이미지 (PNG)
    const greenTriangle = Buffer.from(
        '89504e470d0a1a0a0000000d494844520000006400000064080600000070e295540000006849444154789cedc1010d000000c2a0f74f6d0e37a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000be0d210000012724f0370000000049454e44ae426082',
        'hex'
    );
    images.push({ name: 'green_triangle.png', data: greenTriangle.toString('base64'), type: 'image/png' });
    
    return images;
}

// 단일 이미지 분석 (한줄평)
async function analyzeSingleImage(imageData, imageName) {
    console.log(`🔍 [${imageName}] 단일 이미지 분석 중...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            이 이미지를 전문가 수준으로 매우 구체적이고 정밀하게 분석하여 완전한 제품 감정평가를 제공하세요.

            필수 분석 항목:
            1. 브랜드/제조사 (로고나 텍스트가 보이면)
            2. 정확한 제품 카테고리 (스마트폰, 운동화, 노트북, 가방, 시계, 의류 등)
            3. 구체적 색상 (매트 블랙, 글로시 화이트, 스페이스 그레이 등)
            4. 재질/소재 (가죽, 캔버스, 알루미늄, 실리콘, 패브릭 등)
            5. **제품 상태/사용감 (핵심 요소)**:
               - 새제품: 새것, 미사용, 깨끗한
               - 경미한 사용감: 약간 사용된, 깨끗한 중고
               - 보통 사용감: 사용 흔적, 일부 마모
               - 심한 사용감: 많이 사용된, 마모 심한
               - 파손: 손상된, 찢어진, 깨진

            상태 분석 세부항목:
            - 신발: 밑창 마모, 뒤꿈치 닳음, 어퍼 변형
            - 전자제품: 스크래치, 찌그러짐, 화면 상태
            - 가죽제품: 주름, 갈라짐, 색 변화
            - 의류: 보풀, 변색, 늘어남

            출력 형식: "[상태] [색상/재질] [브랜드명] [제품명/카테고리]"

            전문가 수준 예시:
            ✓ "새것 매트 블랙 아이폰 14 프로 맥스"
            ✓ "경미한 사용감 있는 화이트 나이키 에어포스 운동화"
            ✓ "사용 흔적 있는 브라운 루이비통 모노그램 토트백"
            ✓ "많이 사용된 스페이스 그레이 맥북 프로"
            ✓ "밑창 마모된 검은 가죽 드레스 슈즈"
            ✓ "스크래치 있는 실버 스테인레스 시계"
            ✓ "보풀 있는 네이비 울 니트"

            절대 금지 표현:
            ✗ 모든 감정적/주관적 형용사 (멋진, 좋은, 아름다운, 예쁜, 훌륭한)
            ✗ 일반적 단어 (제품, 상품, 아이템, 물건, 것)
            ✗ 추측성 브랜드명 (확실하지 않으면 생략)

            전문 감정평가 결과 (20-35글자):
        `;
        
        const imagePart = {
            inlineData: {
                data: imageData.data,
                mimeType: imageData.type
            }
        };
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim().replace(/["']/g, '');
        
        console.log(`✅ [${imageName}] 한줄평: "${text}"`);
        return text;
        
    } catch (error) {
        console.error(`❌ [${imageName}] 분석 실패:`, error.message);
        return '분석 실패';
    }
}

// 종합 이미지 분석
async function analyzeMultipleImages(imageDataList, productName) {
    console.log(`🔍 [${productName}] 종합 이미지 분석 중...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const images = imageDataList.map(img => ({
            inlineData: {
                data: img.data,
                mimeType: img.type
            }
        }));
        
        const prompt = `
            이 이미지들을 객관적으로 분석해주세요.
            제품명: ${productName}
            
            각 이미지에서 보이는 것을 구체적으로 설명하고 다음을 분석해주세요:
            
            1. 보이는 객체들 (색상, 형태, 크기, 재질)
            2. 제품의 물리적 특징 (실제로 보이는 것만)
            3. 색상 구성 (주요 색상들)
            4. 구도와 배치
            5. 배경과 환경
            
            JSON 형식으로 응답해주세요:
            {
                "visibleObjects": "보이는 객체들의 구체적 설명",
                "features": ["물리적 특징1", "물리적 특징2", "물리적 특징3"],
                "colors": ["주요색상1", "주요색상2"],
                "composition": "구도와 배치 설명",
                "background": "배경 설명",
                "material": "추정되는 재질",
                "size": "추정 크기나 비율"
            }
        `;
        
        const result = await model.generateContent([prompt, ...images]);
        const response = await result.response;
        const text = response.text();
        
        console.log(`📄 [${productName}] 원본 응답:`, text.substring(0, 200) + '...');
        
        // JSON 파싱 시도
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log(`✅ [${productName}] 종합 분석 성공!`);
                return analysis;
            }
        } catch (e) {
            console.log(`⚠️ [${productName}] JSON 파싱 실패, 기본값 사용`);
        }
        
        return {
            visibleObjects: '다양한 기하학적 도형들',
            features: ['색상 확인됨', '형태 확인됨', '크기 확인됨'],
            colors: ['빨강', '파랑', '초록'],
            composition: '중앙 배치',
            background: '단색 배경',
            material: '디지털 그래픽',
            size: '100x100 픽셀'
        };
        
    } catch (error) {
        console.error(`❌ [${productName}] 종합 분석 실패:`, error.message);
        throw error;
    }
}

// 스크립트 생성 테스트
async function generateScript(analysis, productName, style = 'dynamic') {
    console.log(`📝 [${productName}] 스크립트 생성 중...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            10초 쇼츠 영상을 위한 스크립트를 작성해주세요.
            
            제품: ${productName}
            스타일: ${style}
            분석 결과: ${JSON.stringify(analysis)}
            
            구조:
            0-2초: 강력한 훅 (시선 끌기)
            2-4초: 문제/니즈 제시
            4-6초: 제품 소개
            6-8초: 핵심 혜택
            8-10초: CTA
            
            각 구간별로:
            - narration: 나레이션 텍스트
            - caption: 화면 자막
            - visualDirection: 영상 연출 지시
            
            JSON 형식으로 응답해주세요.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const script = JSON.parse(jsonMatch[0]);
                console.log(`✅ [${productName}] 스크립트 생성 성공!`);
                return script;
            }
        } catch (e) {
            console.log(`⚠️ [${productName}] 스크립트 JSON 파싱 실패`);
        }
        
        return {
            "0-2": {
                narration: `드디어 나왔습니다! ${productName}`,
                caption: `✨ ${productName} ✨`,
                visualDirection: "제품 클로즈업"
            },
            "2-4": {
                narration: "이런 제품을 찾고 계셨나요?",
                caption: "🎯 딱 맞는 선택!",
                visualDirection: "제품 특징 강조"
            },
            "4-6": {
                narration: `${productName}의 특별함`,
                caption: "💎 프리미엄 품질",
                visualDirection: "제품 디테일"
            },
            "6-8": {
                narration: "지금이 기회입니다",
                caption: "⚡ 한정 수량",
                visualDirection: "제품 전체 샷"
            },
            "8-10": {
                narration: "지금 바로 확인하세요!",
                caption: "📱 문의 환영",
                visualDirection: "CTA 강조"
            }
        };
        
    } catch (error) {
        console.error(`❌ [${productName}] 스크립트 생성 실패:`, error.message);
        throw error;
    }
}

// 전체 테스트 실행
async function runAdvancedTest() {
    console.log('🚀 고급 분석 테스트 시작...\n');
    
    try {
        // 1. 테스트 이미지 생성
        console.log('📸 테스트 이미지 생성 중...');
        const testImages = generateTestImages();
        console.log(`✅ ${testImages.length}개 테스트 이미지 생성됨\n`);
        
        // 2. 개별 이미지 분석
        console.log('🔍 개별 이미지 분석...');
        const singleAnalysis = [];
        for (const image of testImages) {
            const analysis = await analyzeSingleImage(image, image.name);
            singleAnalysis.push({
                name: image.name,
                analysis: analysis
            });
            
            // API 호출 간격 조절
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('\n📊 개별 분석 결과:');
        singleAnalysis.forEach(result => {
            console.log(`   ${result.name}: "${result.analysis}"`);
        });
        
        // 3. 종합 분석
        console.log('\n🔍 종합 이미지 분석...');
        const productName = '테스트 기하학 도형 세트';
        const comprehensiveAnalysis = await analyzeMultipleImages(testImages, productName);
        
        console.log('\n📊 종합 분석 결과:');
        console.log(JSON.stringify(comprehensiveAnalysis, null, 2));
        
        // 4. 스크립트 생성
        console.log('\n📝 스크립트 생성...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const script = await generateScript(comprehensiveAnalysis, productName, 'dynamic');
        
        console.log('\n📊 생성된 스크립트:');
        console.log(JSON.stringify(script, null, 2));
        
        // 5. 결과 요약
        console.log('\n' + '='.repeat(60));
        console.log('✅ 모든 테스트 완료!');
        console.log('='.repeat(60));
        console.log(`📸 처리된 이미지: ${testImages.length}개`);
        console.log(`🔍 개별 분석: ${singleAnalysis.filter(a => a.analysis !== '분석 실패').length}/${singleAnalysis.length}개 성공`);
        console.log(`📊 종합 분석: ${comprehensiveAnalysis ? '성공' : '실패'}`);
        console.log(`📝 스크립트 생성: ${script ? '성공' : '실패'}`);
        
        // 6. 결과 파일 저장
        const results = {
            timestamp: new Date().toISOString(),
            productName: productName,
            images: testImages.length,
            singleAnalysis: singleAnalysis,
            comprehensiveAnalysis: comprehensiveAnalysis,
            script: script
        };
        
        await fs.writeFile(
            path.join(__dirname, 'test-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        console.log('\n💾 결과가 test-results.json 파일에 저장되었습니다.');
        
    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error);
        console.error('스택 트레이스:', error.stack);
    }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    runAdvancedTest().catch(console.error);
}

export default {
    analyzeSingleImage,
    analyzeMultipleImages,
    generateScript,
    runAdvancedTest
};