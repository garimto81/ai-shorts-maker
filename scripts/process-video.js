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
    
    try {
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

  // 2단계 나레이션 생성 (전체 맥락 → 이미지별 분할)
  async generateBasicNarration(analysisResults, totalDuration) {
    const successfulResults = analysisResults.filter(result => result.success);
    
    // 1단계: 전체 맥락에 맞는 완전한 스토리 설계
    const fullStoryData = await this.generateFullStory(successfulResults, totalDuration);
    
    // 2단계: 완성된 스토리를 이미지별 시간대에 분할
    const segments = this.splitStoryIntoSegments(fullStoryData.fullScript, successfulResults, totalDuration);
    
    // 업종별 기본 키워드 설정
    let defaultKeywords = ['중고제품', '고품질', '합리적가격'];
    if (successfulResults.some(r => r.analysis && r.analysis.includes('휠'))) {
      defaultKeywords = ['신차급퍼포먼스', 'CNC가공', '분체클리어', '발란스체크', '전문복원'];
    }
    
    return {
      totalDuration,
      fullStoryData: fullStoryData, // 전체 스토리 정보 추가
      segments,
      fullScript: fullStoryData.fullScript,
      keywords: defaultKeywords
    };
  }
  
  // 1단계: 전체 맥락 완전한 스토리 생성
  async generateFullStory(analysisResults, totalDuration) {
    try {
      // 모든 이미지 분석 결과를 종합하여 전체적인 맥락 파악
      const allAnalysis = analysisResults.map(r => r.analysis).join(', ');
      
      const prompt = `
        다음 이미지들의 분석 결과를 바탕으로 전체적으로 일관성 있는 완전한 마케팅 스토리를 작성하세요.
        총 ${totalDuration}초 분량의 영상용 나레이션입니다.

        이미지 분석 결과들:
        ${analysisResults.map((r, i) => `${i+1}. ${r.analysis}`).join('\n')}

        요구사항:
        1. 전체적으로 일관된 스토리텔링
        2. 시작-중간-끝의 완성된 구조
        3. ${totalDuration}초에 맞는 자연스러운 호흡
        4. 각 이미지가 전체 스토리에서 담당할 역할 고려
        5. 감정적 몰입과 구매 유도가 가능한 구성

        JSON 형식으로 응답:
        {
          "fullScript": "완전한 나레이션 전체 텍스트",
          "storyStructure": "스토리 구조 설명",
          "keyMessage": "핵심 메시지",
          "emotionalTone": "감정적 톤"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // JSON 파싱 시도
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const storyData = JSON.parse(jsonMatch[0]);
          console.log('✅ 전체 스토리 생성 완료');
          return storyData;
        }
      } catch (parseError) {
        console.log('⚠️ 전체 스토리 JSON 파싱 실패, 기본값 사용');
      }
      
      // 기본값 반환
      return {
        fullScript: allAnalysis + "에 대한 완성된 스토리입니다.",
        storyStructure: "이미지 순서에 따른 기본 구조",
        keyMessage: "고품질 제품 소개",
        emotionalTone: "신뢰감과 전문성"
      };
      
    } catch (error) {
      console.error('❌ 전체 스토리 생성 오류:', error);
      
      // 오류 시 기본값
      const allAnalysis = analysisResults.map(r => r.analysis).join(', ');
      return {
        fullScript: allAnalysis + "에 대한 전문적인 소개입니다.",
        storyStructure: "순차적 제품 소개",
        keyMessage: "품질과 가치 제안",
        emotionalTone: "전문성과 신뢰감"
      };
    }
  }
  
  // 2단계: 완성된 스토리를 이미지별 세그먼트로 분할
  splitStoryIntoSegments(fullScript, analysisResults, totalDuration) {
    const segments = [];
    const segmentCount = analysisResults.length;
    const segmentDuration = Math.floor(totalDuration / segmentCount);
    
    // 전체 스크립트를 자연스럽게 분할
    const sentences = fullScript.split(/[.!?]/).filter(s => s.trim().length > 0);
    const segmentsPerScript = Math.ceil(sentences.length / segmentCount);
    
    for (let i = 0; i < segmentCount; i++) {
      const startTime = i * segmentDuration;
      const endTime = startTime + segmentDuration;
      
      // 해당 세그먼트에 할당할 문장들
      const startSentenceIndex = i * segmentsPerScript;
      const endSentenceIndex = Math.min(startSentenceIndex + segmentsPerScript, sentences.length);
      const segmentSentences = sentences.slice(startSentenceIndex, endSentenceIndex);
      
      segments.push({
        startTime,
        endTime,
        imageIndex: i,
        script: segmentSentences.join('. ').trim() + '.',
        relatedAnalysis: analysisResults[i].analysis // 참고용 이미지 분석
      });
    }
    
    return segments;
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

  // ===========================================
  // 향상된 비디오 생성 메서드 (2단계 나레이션 지원)
  // ===========================================
  
  async generateEnhancedVideo(options) {
    const {
      images,
      productName,
      industry,
      style = 'dynamic',
      analysisResults,
      storyData,
      duration = 30
    } = options;
    
    console.log('🎬 향상된 비디오 생성 시작:', {
      productName,
      industry,
      imageCount: images.length,
      duration,
      hasStoryData: !!storyData
    });
    
    try {
      await this.init();
      
      // 1단계: 이미지 처리 및 저장
      const processedImages = await this.processImagesForVideo(images, analysisResults);
      
      // 2단계: 2단계 나레이션 데이터를 비디오 세그먼트로 변환
      const videoSegments = await this.createVideoSegments(processedImages, storyData, duration);
      
      // 3단계: FFmpeg를 사용한 비디오 생성
      const videoResult = await this.generateVideoWithFFmpeg({
        segments: videoSegments,
        productName,
        industry,
        style,
        duration,
        fullStoryData: storyData.fullStoryData
      });
      
      console.log('✅ 향상된 비디오 생성 완료:', videoResult.filename);
      
      return {
        filename: videoResult.filename,
        outputPath: videoResult.outputPath,
        duration: videoResult.duration,
        metadata: {
          productName,
          industry,
          style,
          segmentCount: videoSegments.length,
          totalImages: processedImages.length,
          storyTitle: storyData.fullStoryData?.title,
          processingTime: Date.now() - videoResult.startTime
        }
      };
      
    } catch (error) {
      console.error('❌ 향상된 비디오 생성 오류:', error);
      throw error;
    }
  }
  
  // 이미지 처리 및 최적화
  async processImagesForVideo(images, analysisResults) {
    const sharp = (await import('sharp')).default;
    const processedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const imageDataUrl = images[i];
        const base64Data = imageDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 9:16 비율로 최적화 (쇼츠 형태)
        const optimizedBuffer = await sharp(imageBuffer)
          .resize(1080, 1920, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        const imagePath = path.join(this.tempDir, `processed_image_${i}.jpg`);
        await fsPromises.writeFile(imagePath, optimizedBuffer);
        
        processedImages.push({
          path: imagePath,
          index: i,
          analysis: analysisResults && analysisResults[i] ? analysisResults[i].analysis : null,
          filename: analysisResults && analysisResults[i] ? analysisResults[i].filename : `image_${i}.jpg`
        });
        
        console.log(`📷 이미지 ${i + 1}/${images.length} 처리 완료`);
        
      } catch (error) {
        console.error(`❌ 이미지 ${i} 처리 오류:`, error);
        throw new Error(`이미지 ${i + 1} 처리 실패: ${error.message}`);
      }
    }
    
    return processedImages;
  }
  
  // 비디오 세그먼트 생성
  async createVideoSegments(processedImages, storyData, totalDuration) {
    const segments = [];
    const { fullStoryData, segments: storySegments } = storyData;
    
    console.log('🎭 비디오 세그먼트 생성:', {
      imageCount: processedImages.length,
      storySegmentCount: storySegments ? storySegments.length : 0,
      totalDuration
    });
    
    // 이미지당 균등 시간 배분
    const segmentDuration = Math.floor(totalDuration / processedImages.length * 100) / 100;
    
    for (let i = 0; i < processedImages.length; i++) {
      const image = processedImages[i];
      const storySegment = storySegments && storySegments[i] ? storySegments[i] : null;
      
      const segment = {
        index: i,
        imagePath: image.path,
        duration: segmentDuration,
        startTime: i * segmentDuration,
        endTime: (i + 1) * segmentDuration,
        
        // 나레이션 데이터
        narration: storySegment ? {
          text: storySegment.narration || '',
          emotion: storySegment.emotion || 'neutral',
          timing: storySegment.timing || 'medium',
          imageDescription: image.analysis || ''
        } : {
          text: `${image.filename}에 대한 설명`,
          emotion: 'neutral',
          timing: 'medium',
          imageDescription: image.analysis || ''
        },
        
        // 이미지 메타데이터
        imageMetadata: {
          filename: image.filename,
          analysis: image.analysis,
          originalIndex: image.index
        }
      };
      
      segments.push(segment);
    }
    
    console.log(`✅ ${segments.length}개 비디오 세그먼트 생성 완료`);
    return segments;
  }
  
  // FFmpeg를 사용한 실제 비디오 생성
  async generateVideoWithFFmpeg(options) {
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    const { segments, productName, industry, style, duration, fullStoryData } = options;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `${productName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${timestamp}_${Date.now()}.mp4`;
    const outputPath = path.join(this.outputDir, filename);
    
    console.log('🎬 FFmpeg 비디오 생성 시작:', {
      segmentCount: segments.length,
      filename,
      duration
    });
    
    const startTime = Date.now();
    
    try {
      // 임시 비디오 세그먼트들 생성
      const segmentPaths = [];
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentPath = path.join(this.tempDir, `segment_${i}.mp4`);
        
        await new Promise((resolve, reject) => {
          ffmpeg(segment.imagePath)
            .inputOptions([
              '-loop 1',
              `-t ${segment.duration}`,
              '-r 30'
            ])
            .outputOptions([
              '-c:v libx264',
              '-pix_fmt yuv420p',
              '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
              '-preset fast'
            ])
            .output(segmentPath)
            .on('end', () => {
              console.log(`✅ 세그먼트 ${i + 1}/${segments.length} 생성 완료`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`❌ 세그먼트 ${i + 1} 생성 오류:`, err);
              reject(err);
            })
            .run();
        });
        
        segmentPaths.push(segmentPath);
      }
      
      // 세그먼트들을 하나의 비디오로 합치기
      const concatListPath = path.join(this.tempDir, 'concat_list.txt');
      const concatList = segmentPaths.map(p => `file '${p}'`).join('\n');
      await fsPromises.writeFile(concatListPath, concatList);
      
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatListPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-preset fast',
            '-crf 23'
          ])
          .output(outputPath)
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`🎬 비디오 처리 중: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('✅ 최종 비디오 생성 완료');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ 최종 비디오 생성 오류:', err);
            reject(err);
          })
          .run();
      });
      
      // 임시 파일 정리
      await this.cleanupTempFiles([concatListPath, ...segmentPaths]);
      
      const processingTime = Date.now() - startTime;
      console.log(`🎉 비디오 생성 완료: ${filename} (${Math.round(processingTime/1000)}초 소요)`);
      
      return {
        filename,
        outputPath,
        duration,
        startTime,
        processingTime
      };
      
    } catch (error) {
      console.error('❌ FFmpeg 비디오 생성 실패:', error);
      throw new Error(`비디오 생성 실패: ${error.message}`);
    }
  }
  
  // 임시 파일 정리
  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fsPromises.unlink(filePath);
        console.log(`🧹 임시 파일 정리: ${path.basename(filePath)}`);
      } catch (error) {
        console.log(`⚠️ 임시 파일 정리 실패: ${path.basename(filePath)} - ${error.message}`);
      }
    }
  }
  
  // ===========================================
  // FFmpeg 전환 효과 테스트 메서드들
  // ===========================================
  
  // 기본 전환 효과 테스트
  async testTransitionEffect(options) {
    const { images, transitionType, duration, transitionDuration } = options;
    const startTime = Date.now();
    
    console.log(`🎬 ${transitionType} 전환 효과 테스트 시작`);
    
    try {
      await this.init();
      
      // 이미지를 임시 파일로 저장
      const imagePaths = await this.saveUploadedImages(images);
      
      // 전환 효과별 FFmpeg 명령어 생성
      const ffmpegCommand = this.buildTransitionCommand({
        imagePaths,
        transitionType,
        duration,
        transitionDuration
      });
      
      // 출력 파일명 생성
      const filename = `transition_${transitionType}_${Date.now()}.mp4`;
      const outputPath = path.join(this.outputDir, filename);
      
      // FFmpeg 실행
      await this.executeFFmpegCommand(ffmpegCommand, outputPath);
      
      // 임시 파일 정리
      await this.cleanupTempFiles(imagePaths);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ ${transitionType} 전환 효과 완료: ${Math.round(processingTime/1000)}초`);
      
      return {
        filename,
        duration: (duration * images.length) + (transitionDuration * (images.length - 1)),
        processingTime
      };
      
    } catch (error) {
      console.error(`❌ ${transitionType} 전환 효과 생성 실패:`, error);
      throw error;
    }
  }
  
  // 업로드된 이미지를 임시 파일로 저장
  async saveUploadedImages(images) {
    const sharp = (await import('sharp')).default;
    const imagePaths = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imagePath = path.join(this.tempDir, `temp_image_${i}_${Date.now()}.jpg`);
      
      // 이미지를 9:16 비율로 최적화
      const optimizedBuffer = await sharp(image.buffer)
        .resize(1080, 1920, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      await fsPromises.writeFile(imagePath, optimizedBuffer);
      imagePaths.push(imagePath);
    }
    
    return imagePaths;
  }
  
  // 전환 효과별 FFmpeg 명령어 생성
  buildTransitionCommand(options) {
    const { imagePaths, transitionType, duration, transitionDuration } = options;
    
    console.log('🎨 전환 명령어 생성:', {
      transitionType,
      imageCount: imagePaths.length,
      duration,
      transitionDuration
    });
    
    // 기본 전환 효과 매핑
    const transitionMappings = {
      // 기본 전환 효과
      crossfade: 'fade',
      slideleft: 'slideleft',
      slideright: 'slideright',
      slideup: 'slideup',
      slidedown: 'slidedown',
      wipeleft: 'wipeleft',
      wiperight: 'wiperight',
      circleopen: 'circleopen',
      circleclose: 'circleclose',
      diagtl: 'diagtl',
      diagtr: 'diagtr',
      diagbl: 'diagbl',
      diagbr: 'diagbr',
      dissolve: 'dissolve',
      rotate: 'rotate',
      
      // 커스텀 효과
      zoomfade: 'custom_zoomfade',
      kenburns: 'custom_kenburns',
      pixelize: 'custom_pixelize',
      blur: 'custom_blur',
      glitch: 'custom_glitch',
      colorshift: 'custom_colorshift'
    };
    
    const effect = transitionMappings[transitionType] || 'fade';
    console.log('선택된 효과:', effect);
    
    if (effect.startsWith('custom_')) {
      return this.buildCustomTransition(imagePaths, effect, duration, transitionDuration);
    } else {
      return this.buildStandardTransition(imagePaths, effect, duration, transitionDuration);
    }
  }
  
  // 표준 xfade 전환 효과
  buildStandardTransition(imagePaths, effect, duration, transitionDuration) {
    let filterComplex = '';
    let inputs = '';
    
    console.log(`🔧 표준 전환 효과 생성: ${effect}`);
    
    // 각 이미지를 비디오 스트림으로 변환
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      console.log(`입력 ${i}: ${imagePaths[i]} (${imageDuration}초)`);
    }
    
    // xfade 필터 체인 생성
    let currentLabel = '0:v';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      if (i === 1) {
        filterComplex += `[${currentLabel}][${i}:v]xfade=transition=${effect}:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      } else {
        filterComplex += `[v${i-1}][${i}:v]xfade=transition=${effect}:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      }
      currentLabel = `v${i}`;
    }
    
    const result = {
      imagePaths: imagePaths, // 이미지 경로 직접 전달
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1), // 마지막 ; 제거
      outputLabel: `[v${imagePaths.length - 1}]`
    };
    
    console.log('생성된 명령어:', {
      imageCount: imagePaths.length,
      filterComplexLength: result.filterComplex.length,
      outputLabel: result.outputLabel
    });
    
    return result;
  }
  
  // 커스텀 전환 효과
  buildCustomTransition(imagePaths, effect, duration, transitionDuration) {
    switch (effect) {
      case 'custom_zoomfade':
        return this.buildZoomFadeTransition(imagePaths, duration, transitionDuration);
      case 'custom_kenburns':
        return this.buildKenBurnsTransition(imagePaths, duration, transitionDuration);
      case 'custom_pixelize':
        return this.buildPixelizeTransition(imagePaths, duration, transitionDuration);
      case 'custom_blur':
        return this.buildBlurTransition(imagePaths, duration, transitionDuration);
      case 'custom_glitch':
        return this.buildGlitchTransition(imagePaths, duration, transitionDuration);
      case 'custom_colorshift':
        return this.buildColorShiftTransition(imagePaths, duration, transitionDuration);
      default:
        return this.buildStandardTransition(imagePaths, 'fade', duration, transitionDuration);
    }
  }
  
  // 줌 + 페이드 효과
  buildZoomFadeTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('🔍 줌 페이드 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // 줌 효과 적용
      filterComplex += `[${i}:v]scale=1080:1920,zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=25*${duration}[z${i}];`;
    }
    
    // xfade로 연결
    let currentLabel = 'z0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][z${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // Ken Burns 효과
  buildKenBurnsTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('🎬 Ken Burns 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // Ken Burns 효과 (확대 + 팬)
      const zoomStart = 1.0 + (i % 2) * 0.3; // 교대로 확대 시작점 변경
      const panX = i % 2 === 0 ? 'iw/2-(iw/zoom/2)' : '(iw-iw/zoom)-(iw/zoom/2)';
      const panY = i % 3 === 0 ? 'ih/2-(ih/zoom/2)' : '(ih-ih/zoom)-(ih/zoom/2)';
      
      filterComplex += `[${i}:v]scale=1080:1920,zoompan=z='${zoomStart}+0.002*on':x='${panX}':y='${panY}':d=25*${duration}[kb${i}];`;
    }
    
    // 크로스페이드로 연결
    let currentLabel = 'kb0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][kb${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // 픽셀화 효과
  buildPixelizeTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('🔲 픽셀화 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // 점진적 픽셀화 효과
      filterComplex += `[${i}:v]scale=1080:1920,scale=54:96:flags=neighbor,scale=1080:1920:flags=neighbor[px${i}];`;
    }
    
    // xfade로 연결
    let currentLabel = 'px0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][px${i}]xfade=transition=dissolve:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // 블러 전환 효과
  buildBlurTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('🌫️ 블러 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // 블러 효과
      filterComplex += `[${i}:v]scale=1080:1920,boxblur=5:1[bl${i}];`;
    }
    
    // 블러와 함께 페이드
    let currentLabel = 'bl0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][bl${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // 글리치 효과
  buildGlitchTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('⚡ 글리치 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // 글리치 효과 (노이즈 + 컬러 시프트)
      filterComplex += `[${i}:v]scale=1080:1920,noise=alls=20:allf=t+u,colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131:0:0:0:0:1[gl${i}];`;
    }
    
    // 디졸브 전환
    let currentLabel = 'gl0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][gl${i}]xfade=transition=dissolve:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // 컬러 시프트 효과
  buildColorShiftTransition(imagePaths, duration, transitionDuration) {
    let inputs = '';
    let filterComplex = '';
    
    console.log('🌈 컬러 시프트 전환 효과 생성');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageDuration = duration + (i < imagePaths.length - 1 ? transitionDuration : 0);
      inputs += `-loop 1 -t ${imageDuration} -i "${imagePaths[i]}" `;
      
      // 컬러 시프트 효과
      const hueShift = (i * 60) % 360; // 각 이미지마다 다른 색조
      filterComplex += `[${i}:v]scale=1080:1920,hue=h=${hueShift}[cs${i}];`;
    }
    
    // 페이드 전환
    let currentLabel = 'cs0';
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = (duration * i) - (transitionDuration * (i - 1));
      filterComplex += `[${currentLabel}][cs${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v${i}];`;
      currentLabel = `v${i}`;
    }
    
    return {
      imagePaths: imagePaths,
      inputs: inputs.trim(),
      filterComplex: filterComplex.slice(0, -1),
      outputLabel: `[v${imagePaths.length - 1}]`
    };
  }
  
  // FFmpeg 명령어 실행
  async executeFFmpegCommand(command, outputPath) {
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🎬 FFmpeg 명령어 실행 시작');
        console.log('명령어 정보:', {
          hasInputs: !!command.inputs,
          hasFilterComplex: !!command.filterComplex,
          hasOutputLabel: !!command.outputLabel,
          imagePaths: command.imagePaths || 'not provided'
        });
        
        const ffmpegProcess = ffmpeg();
        
        // 이미지 경로가 직접 제공된 경우 사용
        if (command.imagePaths && Array.isArray(command.imagePaths)) {
          command.imagePaths.forEach((imagePath, index) => {
            console.log(`입력 이미지 ${index + 1}: ${imagePath}`);
            ffmpegProcess.input(imagePath).inputOptions([
              '-loop 1',
              '-t 3', // 기본 3초
              '-r 30'
            ]);
          });
        } else {
          // 기존 inputs 문자열 파싱 방식 (fallback)
          console.log('Inputs 문자열 파싱:', command.inputs);
          const inputPattern = /-loop 1 -t ([\d.]+) -i "?([^"]+)"?/g;
          let match;
          let inputIndex = 0;
          
          while ((match = inputPattern.exec(command.inputs)) !== null) {
            const duration = parseFloat(match[1]);
            const imagePath = match[2].trim();
            console.log(`입력 ${inputIndex}: ${imagePath} (${duration}초)`);
            
            ffmpegProcess.input(imagePath).inputOptions([
              '-loop 1',
              `-t ${duration}`,
              '-r 30'
            ]);
            inputIndex++;
          }
          
          if (inputIndex === 0) {
            throw new Error('유효한 입력 이미지를 찾을 수 없습니다.');
          }
        }
        
        // 필터 복합 적용
        if (command.filterComplex) {
          console.log('필터 복합 적용:', command.filterComplex);
          ffmpegProcess.complexFilter(command.filterComplex);
        }
        
        // 출력 옵션
        const outputOptions = [
          '-c:v libx264',
          '-pix_fmt yuv420p', 
          '-preset fast',
          '-crf 23',
          '-r 30'
        ];
        
        // 출력 레이블이 있는 경우 매핑 추가
        if (command.outputLabel) {
          const mapLabel = command.outputLabel.replace(/[\[\]]/g, '');
          outputOptions.unshift('-map', mapLabel);
          console.log('출력 매핑:', mapLabel);
        }
        
        ffmpegProcess
          .outputOptions(outputOptions)
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg 실행 명령어:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`🎬 처리 중: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('✅ FFmpeg 처리 완료:', outputPath);
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ FFmpeg 상세 오류:', {
              message: err.message,
              stack: err.stack,
              command: command,
              outputPath: outputPath
            });
            reject(new Error(`FFmpeg 실행 실패: ${err.message}`));
          })
          .run();
          
      } catch (error) {
        console.error('❌ executeFFmpegCommand 초기화 오류:', error);
        reject(error);
      }
    });
  }
  
  // 복합 전환 효과 테스트
  async testComplexTransitions(options) {
    const { images, styleType, duration, transitionDuration } = options;
    const startTime = Date.now();
    
    console.log(`🎪 ${styleType} 복합 전환 효과 테스트 시작`);
    
    try {
      await this.init();
      
      const imagePaths = await this.saveUploadedImages(images);
      
      // 스타일별 효과 조합
      const styleEffects = {
        cinematic: ['kenburns', 'crossfade', 'zoomfade'],
        dynamic: ['slideright', 'circleopen', 'rotate'],
        elegant: ['dissolve', 'blur', 'crossfade'],
        energetic: ['glitch', 'colorshift', 'pixelize']
      };
      
      const effects = styleEffects[styleType] || ['crossfade'];
      const filename = `complex_${styleType}_${Date.now()}.mp4`;
      const outputPath = path.join(this.outputDir, filename);
      
      // 복합 효과를 순차적으로 적용
      await this.applyComplexEffects(imagePaths, effects, duration, transitionDuration, outputPath);
      
      await this.cleanupTempFiles(imagePaths);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ ${styleType} 복합 효과 완료: ${Math.round(processingTime/1000)}초`);
      
      return {
        filename,
        duration: (duration * images.length) + (transitionDuration * (images.length - 1)),
        processingTime,
        effects
      };
      
    } catch (error) {
      console.error(`❌ ${styleType} 복합 효과 생성 실패:`, error);
      throw error;
    }
  }
  
  // 복합 효과 적용
  async applyComplexEffects(imagePaths, effects, duration, transitionDuration, outputPath) {
    // 첫 번째 효과로 기본 비디오 생성
    const firstEffect = effects[0];
    const command = this.buildTransitionCommand({
      imagePaths,
      transitionType: firstEffect,
      duration,
      transitionDuration
    });
    
    await this.executeFFmpegCommand(command, outputPath);
    
    // 추가 효과들을 순차적으로 적용 (여기서는 첫 번째 효과만 적용)
    console.log(`🎨 적용된 효과: ${effects.join(', ')}`);
  }
  
  // 전환 효과 비교 테스트
  async compareTransitionEffects(options) {
    const { images, effects, duration, transitionDuration } = options;
    const startTime = Date.now();
    const results = [];
    
    console.log(`⚖️ ${effects.length}개 전환 효과 비교 시작`);
    
    try {
      await this.init();
      
      const imagePaths = await this.saveUploadedImages(images);
      
      // 각 효과별로 비디오 생성
      for (const effect of effects) {
        const effectStartTime = Date.now();
        
        const filename = `compare_${effect}_${Date.now()}.mp4`;
        const outputPath = path.join(this.outputDir, filename);
        
        const command = this.buildTransitionCommand({
          imagePaths,
          transitionType: effect,
          duration,
          transitionDuration
        });
        
        await this.executeFFmpegCommand(command, outputPath);
        
        const effectProcessingTime = Date.now() - effectStartTime;
        
        results.push({
          effect,
          filename,
          processingTime: effectProcessingTime
        });
        
        console.log(`✅ ${effect} 효과 완료: ${Math.round(effectProcessingTime/1000)}초`);
      }
      
      await this.cleanupTempFiles(imagePaths);
      
      const totalProcessingTime = Date.now() - startTime;
      console.log(`🎉 모든 효과 비교 완료: ${Math.round(totalProcessingTime/1000)}초`);
      
      return {
        results,
        totalProcessingTime
      };
      
    } catch (error) {
      console.error('❌ 전환 효과 비교 실패:', error);
      throw error;
    }
  }
  
  // ===========================================
  // 기존 비디오 생성 메서드 (하위 호환성 유지)
  // ===========================================

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