import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class ShortsGenerator {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.outputDir = path.join(__dirname, '..', 'output');
    this.storageDir = path.join(__dirname, '..', 'storage', 'images');
    this.tempDir = path.join(__dirname, '..', 'temp');
  }

  async init() {
    // 디렉토리 생성
    await fsPromises.mkdir(this.outputDir, { recursive: true });
    await fsPromises.mkdir(this.storageDir, { recursive: true });
    await fsPromises.mkdir(this.tempDir, { recursive: true });
  }

  // 이미지 다운로드 및 압축
  async processImage(imageUrl, index) {
    const tempPath = path.join(this.tempDir, `temp_${index}.jpg`);
    
    try {
      // data URL인 경우 직접 처리
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        await fsPromises.writeFile(tempPath, buffer);
      } else {
        // HTTP URL인 경우 다운로드
        await new Promise((resolve, reject) => {
          const file = fs.createWriteStream(tempPath);
          https.get(imageUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', reject);
        });
      }
      
      // 이미지 정보 확인
      const metadata = await sharp(tempPath).metadata();
      const fileSize = (await fsPromises.stat(tempPath)).size;
            
      // 1MB 이하로 압축
      let outputPath = path.join(this.storageDir, `image_${Date.now()}_${index}.jpg`);
      
      if (fileSize > 1024 * 1024) {
        // 품질 조정하여 압축
        let quality = 85;
        let compressed = false;
        
        while (quality > 20 && !compressed) {
          await sharp(tempPath)
            .resize(1920, 1080, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality })
            .toFile(outputPath);
          
          const compressedSize = (await fsPromises.stat(outputPath)).size;
          if (compressedSize < 1024 * 1024) {
            compressed = true;
          } else {
            quality -= 10;
          }
        }
      } else {
        // 이미 1MB 이하면 그대로 복사
        await fsPromises.copyFile(tempPath, outputPath);
      }
      
      // 임시 파일 삭제
      await fsPromises.unlink(tempPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  // 단일 이미지 분석 (한줄평 생성)
  async analyzeSingleImage(imageDataUrl) {
    try {
      const model = this.visionModel;
      
      // 이미지 데이터 준비
      let imageData;
      if (imageDataUrl.startsWith('data:')) {
        const base64Data = imageDataUrl.split(',')[1];
        imageData = {
          inlineData: {
            data: base64Data,
            mimeType: imageDataUrl.split(':')[1].split(';')[0]
          }
        };
      } else {
        // 파일 경로인 경우
        const data = await fsPromises.readFile(imageDataUrl);
        imageData = {
          inlineData: {
            data: data.toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      }
      
      const prompt = `
        이 이미지를 전문가 수준으로 매우 구체적이고 정밀하게 분석하여 정확한 한 줄 설명을 작성하세요.

        필수 분석 요소:
        1. 브랜드/제조사: Nike, Apple, Samsung, LV, Gucci, Adidas, BBS, OZ Racing, Enkei, Vossen 등
        2. 제품 카테고리: 신발, 스마트폰, 노트북, 가방, 시계, 의류, 가전제품, 자동차 휠, 알로이 휠 등
        3. 정밀 색상: 매트 블랙, 글로시 화이트, 스페이스 그레이, 로즈골드, 네이비, 베이지, 건메탈, 실버, 폴리쉬드 등
        4. 재질/소재: 가죽, 캔버스, 알루미늄, 실리콘, 스테인레스, 패브릭, 플라스틱, 알로이, 포지드 알루미늄 등
        5. **제품 상태/사용감 (매우 중요)**:
           - 새제품: 깨끗한, 미사용, 새것
           - 경미한 사용감: 약간 사용된, 깨끗한 중고
           - 보통 사용감: 사용 흔적 있는, 일부 마모
           - 심한 사용감: 많이 사용된, 마모 심한, 낡은
           - 파손: 손상된, 찢어진, 깨진

        상태 분석 세부사항:
        - 스크래치, 얼룩, 색바램, 모서리 마모
        - 가죽 제품: 주름, 갈라짐, 색 변화
        - 신발: 밑창 마모, 뒤꿈치 닳음, 어퍼 변형
        - 전자제품: 스크래치, 찌그러짐, 화면 상태
        - 의류: 보풀, 변색, 늘어남, 구멍
        - **자동차 휠 특별 분석**: 
          * 림 손상 (찌그러짐, 크랙, 벤딩)
          * 스포크 상태 (스크래치, 부식, 변형)
          * 표면 마감 (광택 정도, 클리어 코팅 상태)
          * 복원 흔적 (리페어 자국, 재도장 여부)
          * 사이즈 표기 (인치, J 수치, 오프셋)

        출력 형식: "[상태] [색상] [브랜드명] [제품카테고리] [특징]"

        전문가 수준 예시:
        ✓ "새것 매트 블랙 아이폰 14 프로 맥스"
        ✓ "경미한 사용감 있는 화이트 나이키 에어포스 운동화"
        ✓ "사용 흔적 있는 브라운 루이비통 모노그램 토트백"
        ✓ "많이 사용된 스페이스 그레이 맥북 프로"
        ✓ "깨끗한 중고 베이지 버버리 트렌치 코트"
        ✓ "밑창 마모된 검은 가죽 드레스 슈즈"
        ✓ "스크래치 있는 실버 롤렉스 시계"
        ✓ "변색된 네이비 데님 청바지"
        
        **휠 복원 전문 예시 (실제 업계 스타일):**
        ✓ "휠 기스로 입고된 18인치 BMW 순정 알로이 휠을 CNC 가공으로 신차급 복원"
        ✓ "샌드블라스터와 분체도색으로 무게감 더한 19인치 유광 블랙 포드 휠"
        ✓ "다이아몬드 컷팅휠 벤츠 E클래스 17인치를 분체클리어로 견고함 극대화"
        ✓ "굴절과 크랙 없는 20인치 매트블랙 휠을 고온건조기 180도 처리"
        ✓ "허름한 상태의 16인치 휠을 집도하여 명품 브랜드 품격 되살린 결과"
        ✓ "발란스 체크까지 완료한 18인치 신차급 퍼포먼스 복원 휠"

        절대 금지 표현:
        ✗ 모든 감정적/주관적 형용사 (멋진, 좋은, 아름다운, 예쁜, 훌륭한)
        ✗ 일반적 단어 (제품, 상품, 아이템, 물건, 것)
        ✗ 추측성 브랜드명 (확실하지 않으면 생략)

        중요 주의사항:
        - 실제로 보이는 상태만 정확히 서술
        - 추측하지 말고 관찰되는 것만 언급
        - 20-35글자 내외로 상세하게 작성
        - 상태 분석을 반드시 포함

        전문 분석 결과:
      `;
      
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text().trim();
      
      // 따옴표 제거
      return text.replace(/["']/g, '');
      
    } catch (error) {
      console.error('Error analyzing single image:', error);
      console.error('Error details:', error.message);
      
      // 더 구체적인 에러별 기본값
      if (error.message.includes('API key')) {
        return 'API키 오류';
      } else if (error.message.includes('quota')) {
        return '할당량 초과';
      } else if (error.message.includes('image')) {
        return '이미지 처리 오류';
      } else {
        return '분석 불가';
      }
    }
  }

  // AI 파일명 분석 및 정렬
  async analyzeFilenames(filenames) {
    try {
      console.log('🤖 AI 파일명 분석 시작:', filenames);
      
      const prompt = `
        다음 파일명들을 분석하여 논리적인 순서로 정렬하세요.

        파일명 목록:
        ${filenames.map((name, index) => `${index}: ${name}`).join('\n')}

        분석 요소:
        1. 시간 정보 (날짜, 시각, 타임스탬프)
        2. 순서 번호 (숫자 시퀀스)
        3. 제품 촬영 순서 (정면, 측면, 세부, 전체)
        4. 파일명 패턴 (접두사, 접미사)

        다양한 파일명 패턴 예시:
        - IMG_20240315_143025.jpg (날짜/시간)
        - product_01.jpg, product_02.jpg (순서)
        - front.jpg, side.jpg, detail.jpg (촬영각도)
        - 20240315143025_1.jpg (타임스탬프_순서)
        - DSC_0123.jpg (카메라 기본)
        - photo_2024-03-15_14-30-25.jpg (구분자 포함)

        출력 형식 (JSON):
        {
          "analysis": "파일명 패턴 분석 결과",
          "pattern": "detected_pattern_type",
          "sortedOrder": [정렬된 인덱스 배열],
          "reasoning": "정렬 근거 설명"
        }

        예시:
        {
          "analysis": "시간 기반 파일명으로 2024년 3월 15일 촬영 순서",
          "pattern": "timestamp",
          "sortedOrder": [0, 2, 1, 3],
          "reasoning": "파일명의 타임스탬프를 기준으로 시간순 정렬"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // JSON 파싱 시도
      try {
        // JSON 블록에서 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);
          
          // 인덱스 유효성 검사
          if (analysisResult.sortedOrder && Array.isArray(analysisResult.sortedOrder)) {
            // 모든 인덱스가 유효한지 확인
            const validIndices = analysisResult.sortedOrder.every(
              index => index >= 0 && index < filenames.length
            );
            
            if (validIndices) {
              console.log('✅ AI 파일명 분석 완료:', analysisResult);
              return analysisResult;
            }
          }
        }
        
        // AI 분석 실패 시 기본 정렬 (시간 기반)
        console.log('⚠️ AI 분석 결과 파싱 실패, 기본 정렬 사용');
        return this.fallbackFilenameSort(filenames);
        
      } catch (parseError) {
        console.log('⚠️ JSON 파싱 실패, 기본 정렬 사용:', parseError);
        return this.fallbackFilenameSort(filenames);
      }
      
    } catch (error) {
      console.error('❌ AI 파일명 분석 오류:', error);
      return this.fallbackFilenameSort(filenames);
    }
  }

  // 기본 파일명 정렬 (AI 분석 실패 시)
  fallbackFilenameSort(filenames) {
    const indices = Array.from({ length: filenames.length }, (_, i) => i);
    
    // 시간 정보가 있으면 시간순, 없으면 숫자순, 그도 없으면 알파벳순
    const sortedIndices = indices.sort((a, b) => {
      const nameA = filenames[a];
      const nameB = filenames[b];
      
      // 시간 정보 추출 시도
      const timeA = this.extractTimeFromFilename(nameA);
      const timeB = this.extractTimeFromFilename(nameB);
      
      if (timeA !== 0 && timeB !== 0) {
        return timeA - timeB; // 시간순 정렬
      }
      
      // 숫자 정보 추출 시도
      const numA = this.extractNumberFromFilename(nameA);
      const numB = this.extractNumberFromFilename(nameB);
      
      if (numA !== 0 || numB !== 0) {
        return numA - numB; // 숫자순 정렬
      }
      
      // 알파벳순 정렬
      return nameA.localeCompare(nameB);
    });

    return {
      analysis: "기본 정렬 알고리즘 사용",
      pattern: "fallback",
      sortedOrder: sortedIndices,
      reasoning: "AI 분석 실패로 인한 기본 시간/숫자/알파벳순 정렬"
    };
  }

  // 파일명에서 시간 추출
  extractTimeFromFilename(filename) {
    const timePatterns = [
      /(\d{4})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})/,
      /(\d{8})[\-_]?(\d{6})/,
      /(\d{13,14})/ // Unix timestamp
    ];
    
    for (const pattern of timePatterns) {
      const match = filename.match(pattern);
      if (match) {
        if (match[0].length >= 13) {
          return parseInt(match[0]);
        } else {
          const year = parseInt(match[1]) || new Date().getFullYear();
          const month = (parseInt(match[2]) || 1) - 1;
          const day = parseInt(match[3]) || 1;
          const hour = parseInt(match[4]) || 0;
          const minute = parseInt(match[5]) || 0;
          const second = parseInt(match[6]) || 0;
          return new Date(year, month, day, hour, minute, second).getTime();
        }
      }
    }
    return 0;
  }

  // 파일명에서 숫자 추출
  extractNumberFromFilename(filename) {
    const match = filename.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // 휠 복원 스토리텔링 나레이션 생성 (이미지당 5초)
  async generateNarration(analysisResults, industry = 'auto') {
    try {
      console.log(`🎙️ ${industry} 업종 나레이션 생성 시작...`);
      
      const successfulResults = analysisResults.filter(result => result.success);
      const totalImages = successfulResults.length;
      const totalDuration = totalImages * 5; // 이미지당 5초
      
      // 휠 복원 전용 스토리텔링 나레이션
      if (industry === 'wheel-restoration') {
        return await this.generateWheelRestorationNarration(successfulResults, totalDuration);
      }
      
      // 기존 업종들은 기본 나레이션으로 처리
      return await this.generateGeneralNarration(successfulResults, industry, totalDuration);
      
    } catch (error) {
      console.error('❌ 나레이션 생성 오류:', error);
      return this.generateBasicNarration(analysisResults, totalImages * 5);
    }
  }

  // 휠 복원 전용 스토리텔링 나레이션 생성
  async generateWheelRestorationNarration(successfulResults, totalDuration) {
    try {
      // 이미지 분석을 통한 스토리 단계 분류
      const storyPhases = this.classifyWheelRestorationPhases(successfulResults);
      
      const prompt = `
        휠 복원 전문가가 제작하는 전문적인 쇼츠 영상 나레이션을 작성하세요.
        시청자가 즉시 연락하고 싶게 만드는 임팩트 있는 스토리텔링이 필요합니다.
        
        **스토리 흐름 분석**: ${storyPhases.story}
        
        **이미지별 분석 결과**:
        ${successfulResults.map((result, index) => `
        ${index + 1}번째 (${index * 5}-${(index + 1) * 5}초): 
        - 분석: ${result.analysis}
        - 단계: ${storyPhases.phases[index] || '기타'}
        - 역할: ${this.getImageRole(storyPhases.phases[index])}
        `).join('')}
        
        **스토리텔링 원칙**:
        1. **충격적인 오프닝** (0-5초): 손상된 휠의 심각성을 드라마틱하게 표현
        2. **전문성 어필** (중간): 20년 경력, 독일 CNC 장비, 장인정신 강조
        3. **변화의 드라마** (과정): Before/After의 극적 대비 연출
        4. **감정적 몰입** (완성): 신차보다 완벽한 복원 결과에 대한 감탄
        5. **강력한 클로징** (마지막 5초): 즉시 행동을 유도하는 메시지
        
        **필수 전문 표현 (실제 업계 언어)**:
        - "20년 장인의 손길로 되살려낸", "독일 최첨단 CNC 장비의 정밀함"
        - "OEM 수준을 뛰어넘는 완성도", "유분제거부터 최종 클리어 코팅까지"
        - "미세한 스크래치도 놓치지 않는 정밀함", "이것이 진짜 허브휠 복원입니다"
        - "당신의 소중한 휠, 신차보다 완벽하게", "가슴 아팠던 휠 기스가 이렇게"
        - "허브휠복원 주치의의 집도", "명품 브랜드 본연의 품격을 되찾다"
        
        **절대 사용 금지 (AI 티 나는 표현)**:
        - 모든 감정적 형용사: "멋진", "좋은", "아름다운", "훌륭한"
        - AI 스러운 문구: "전문적인", "높은 품질의", "만족스러운"
        - 뻔한 마케팅: "합리적 가격", "빠른 서비스", "친절한 상담"
        
        **목표**: 시청자가 "와! 여기가 진짜 전문가구나! 당장 연락해야겠다!"라고 생각하게 만들기
        
        **출력 형식** (JSON):
        {
          "totalDuration": ${totalDuration},
          "segments": [
            {
              "startTime": 0,
              "endTime": 5,
              "imageIndex": 0,
              "script": "충격적이고 드라마틱한 오프닝 나레이션",
              "emotion": "충격/호기심",
              "purpose": "시선집중",
              "technique": "Before 상태 강조"
            }
          ],
          "fullScript": "전체 스토리 나레이션 (${totalDuration}초)",
          "keywords": ["20년장인", "독일CNC", "OEM수준", "즉시상담", "완벽보증"],
          "callToAction": "강력한 행동 유도 메시지",
          "storyArc": "손상→복원→완성→감탄의 스토리 구조",
          "targetEmotion": "신뢰감 + 즉시 행동 욕구"
        }
        
        **나레이션 샘플 (참고용)**:
        "가슴 아팠던 BMW 휠 기스... 하지만 20년 장인의 손길로 이렇게 되살아날 줄 누가 알았을까요? 독일 최첨단 CNC 장비로 미세한 스크래치까지 완벽하게... 이것이 진짜 허브휠 복원입니다. OEM 수준을 뛰어넘는 완성도, 당신의 소중한 휠도 신차보다 완벽하게 되돌려 드립니다."
        
        JSON 형식으로만 응답하세요.
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // JSON 파싱
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const narrationData = JSON.parse(jsonMatch[0]);
          console.log('✅ 휠 복원 스토리텔링 나레이션 완료:', `${narrationData.totalDuration}초`);
          return narrationData;
        }
      } catch (parseError) {
        console.error('⚠️ JSON 파싱 실패:', parseError);
      }
      
      // 실패 시 기본 나레이션
      return this.generateBasicNarration(successfulResults, totalDuration);
      
    } catch (error) {
      console.error('❌ 휠 복원 나레이션 생성 오류:', error);
      return this.generateBasicNarration(successfulResults, totalDuration);
    }
  }

  // 휠 복원 단계 분류
  classifyWheelRestorationPhases(successfulResults) {
    const phases = [];
    let story = "손상된 휠 발견 → 전문 복원 과정 → 완성된 결과 → 고객 감동";
    
    successfulResults.forEach((result, index) => {
      const analysis = result.analysis.toLowerCase();
      
      // 손상 상태 키워드
      if (analysis.includes('손상') || analysis.includes('스크래치') || analysis.includes('긁힘') || 
          analysis.includes('녹슨') || analysis.includes('찍힘') || analysis.includes('벗겨짐') ||
          analysis.includes('기스') || analysis.includes('흠집') || analysis.includes('상처')) {
        phases[index] = 'damage';
      }
      // 복원 작업 키워드  
      else if (analysis.includes('작업') || analysis.includes('가공') || analysis.includes('복원') || 
               analysis.includes('샌딩') || analysis.includes('도장') || analysis.includes('cnc') ||
               analysis.includes('세척') || analysis.includes('연마') || analysis.includes('수리')) {
        phases[index] = 'process';
      }
      // 완성 결과 키워드
      else if (analysis.includes('완성') || analysis.includes('새것') || analysis.includes('광택') || 
               analysis.includes('반짝') || analysis.includes('깔끔') || analysis.includes('완벽') ||
               analysis.includes('복구') || analysis.includes('신품')) {
        phases[index] = 'result';
      }
      // 차량 장착/최종 키워드
      else if (analysis.includes('장착') || analysis.includes('차량') || analysis.includes('설치') ||
               analysis.includes('타이어') || analysis.includes('주행')) {
        phases[index] = 'final';
      }
      else {
        phases[index] = 'other';
      }
    });
    
    return { phases, story };
  }

  // 이미지 역할 정의
  getImageRole(phase) {
    const roles = {
      'damage': '충격적인 손상 상태로 시청자 관심 끌기',
      'process': '전문적인 복원 과정으로 신뢰감 구축',
      'result': '드라마틱한 완성 결과로 감탄 유도',
      'final': '최종 결과물로 행동 유도',
      'other': '추가 정보 제공'
    };
    return roles[phase] || roles['other'];
  }

  // 일반 업종 나레이션 생성
  async generateGeneralNarration(successfulResults, industry, totalDuration) {
    const industryPrompts = {
      'auto': '자동차 관련 제품에 적합한 전문적인 설명',
      'fashion': '패션 아이템의 스타일과 트렌드 중심 설명',
      'tech': '전자제품의 기능과 성능 중심 설명', 
      'food': '식품의 맛과 품질 중심 설명',
      'beauty': '뷰티 제품의 효과와 사용감 중심 설명',
      'other': '일반적인 제품 설명'
    };
    
    const industryPrompt = industryPrompts[industry] || industryPrompts['other'];
    
    const prompt = `
      다음 ${successfulResults.length}장의 이미지 분석 결과를 바탕으로 ${totalDuration}초 동안 재생되는 쇼츠 영상용 나레이션을 작성해주세요.
      
      **이미지 분석 결과**:
      ${successfulResults.map((result, index) => `
      ${index + 1}번째 이미지 (${index * 5}-${(index + 1) * 5}초): ${result.analysis}
      `).join('')}
      
      **나레이션 스타일**: ${industryPrompt}
      
      다음 JSON 형식으로만 응답하세요:
      {
        "totalDuration": ${totalDuration},
        "segments": [
          {
            "startTime": 0,
            "endTime": 5,
            "imageIndex": 0,
            "script": "첫 번째 이미지에 대한 나레이션"
          }
        ],
        "fullScript": "전체 나레이션 스크립트",
        "keywords": ["키워드1", "키워드2", "키워드3"]
      }
    `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // JSON 파싱
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const narrationData = JSON.parse(jsonMatch[0]);
          console.log('✅ 일반 나레이션 생성 완료:', `${narrationData.totalDuration}초`);
          return narrationData;
        }
      } catch (parseError) {
        console.error('⚠️ JSON 파싱 실패:', parseError);
      }
      
      // 기본 나레이션 생성 (AI 실패 시)
      return this.generateBasicNarration(successfulResults, totalDuration);
      
    } catch (error) {
      console.error('❌ 일반 나레이션 생성 오류:', error);
      return this.generateBasicNarration(successfulResults, totalDuration);
    }
  }


  // 기본 나레이션 생성 (AI 실패 시 fallback)
  async generateBasicNarration(analysisResults, totalDuration) {
    const segments = [];
    const successfulResults = analysisResults.filter(result => result.success);
    
    successfulResults.forEach((result, index) => {
      const startTime = index * 5;
      const endTime = startTime + 5;
      
      segments.push({
        startTime,
        endTime,
        imageIndex: index,
        script: `${result.analysis}에 대한 상세한 설명입니다.`
      });
    });
    
    const fullScript = segments.map(seg => seg.script).join(' ');
    
    // 업종별 기본 키워드 설정
    let defaultKeywords = ['중고제품', '고품질', '합리적가격'];
    if (analysisResults.some(r => r.analysis && r.analysis.includes('휠'))) {
      defaultKeywords = ['신차급퍼포먼스', 'CNC가공', '분체클리어', '발란스체크', '전문복원'];
    }
    
    return {
      totalDuration,
      segments,
      fullScript,
      keywords: defaultKeywords
    };
  }

  // Gemini로 이미지 분석
  async analyzeImages(imagePaths, productName) {
    console.log('🔍 Analyzing images with Gemini Vision...');
    
    const imagePromises = imagePaths.map(async (imagePath) => {
      const imageData = await fsPromises.readFile(imagePath);
      return {
        inlineData: {
          data: imageData.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
    });
    
    const images = await Promise.all(imagePromises);
    
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
    
    const result = await this.visionModel.generateContent([prompt, ...images]);
    const response = await result.response;
    const text = response.text();
    
    // JSON 파싱
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('JSON 파싱 실패, 텍스트 분석 사용');
    }
    
    return {
      visibleObjects: '제품 이미지',
      features: ['색상 확인됨', '형태 확인됨', '크기 확인됨'],
      colors: ['기본 색상'],
      composition: '중앙 배치',
      background: '단색 배경',
      material: '확인 필요',
      size: '표준 크기'
    };
  }

  // 쇼츠 스크립트 생성
  async generateScript(analysis, productName, style) {
    console.log('📝 Generating video script...');
    
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
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('스크립트 생성 실패, 기본값 사용');
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
        narration: analysis.marketingMessage || `${productName}의 특별함`,
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
  }

  // 비디오 생성 (FFmpeg 사용)
  async generateVideo(imagePaths, script, outputPath) {
    console.log('🎬 Generating video with FFmpeg...');
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // 이미지들을 입력으로 추가 (각 2초씩)
      imagePaths.forEach((imagePath, index) => {
        command.input(imagePath)
          .loop(2)
          .inputOptions(['-framerate 30']);
      });
      
      // 필터 적용
      let filterComplex = '';
      imagePaths.forEach((_, index) => {
        // Ken Burns 효과 (줌 인/아웃)
        filterComplex += `[${index}:v]scale=1920:1080,zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=60:s=1080x1920:fps=30[v${index}];`;
      });
      
      // 비디오 연결
      const videoInputs = imagePaths.map((_, i) => `[v${i}]`).join('');
      filterComplex += `${videoInputs}concat=n=${imagePaths.length}:v=1:a=0[outv]`;
      
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map [outv]',
          '-c:v libx264',
          '-preset fast',
          '-crf 22',
          '-pix_fmt yuv420p',
          '-t 10'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          console.log('✅ Video generation complete!');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .run();
    });
  }

  async generate(imageUrls, productName, style = 'dynamic') {
    await this.init();
    
    try {
      // 1. 이미지 다운로드 및 압축
      console.log('📥 Processing images...');
      const imagePaths = await Promise.all(
        imageUrls.map((url, index) => this.processImage(url, index))
      );
      
      // 2. AI 이미지 분석
      const analysis = await this.analyzeImages(imagePaths, productName);
      console.log('Analysis:', analysis);
      
      // 3. 스크립트 생성
      const script = await this.generateScript(analysis, productName, style);
      console.log('Script:', script);
      
      // 4. 비디오 생성
      const outputPath = path.join(this.outputDir, `${productName.replace(/\s+/g, '_')}_${Date.now()}.mp4`);
      await this.generateVideo(imagePaths, script, outputPath);
      
      // 5. 메타데이터 저장
      const metadata = {
        productName,
        style,
        analysis,
        script,
        imagePaths: imagePaths.map(p => path.relative(path.join(__dirname, '..'), p)),
        videoPath: path.relative(path.join(__dirname, '..'), outputPath),
        createdAt: new Date().toISOString()
      };
      
      await fsPromises.writeFile(
        path.join(this.outputDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log('✨ Shorts generation complete!');
      return metadata;
      
    } catch (error) {
      console.error('Error generating shorts:', error);
      throw error;
    }
  }
}

// CLI 실행
if (process.argv[2]) {
  const args = process.argv.slice(2);
  const images = args.find(arg => arg.startsWith('--images=')).split('=')[1].split(',');
  const product = args.find(arg => arg.startsWith('--product=')).split('=')[1];
  const style = args.find(arg => arg.startsWith('--style='))?.split('=')[1] || 'dynamic';
  
  const generator = new ShortsGenerator();
  generator.generate(images, product, style).catch(console.error);
}

export default ShortsGenerator;