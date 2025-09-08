import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ShortsGenerator from './scripts/process-video.js';

// 환경 변수 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 20 * 1024 * 1024,    // 20MB per file
    fieldSize: 25 * 1024 * 1024,   // 25MB for field data (Base64)
    files: 10,                     // Maximum 10 files
    fields: 20                     // Maximum 20 fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

// Initialize generator
const generator = new ShortsGenerator();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// 개별 이미지 분석 엔드포인트
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: '이미지가 필요합니다.' 
      });
    }
    
    // 이미지를 base64로 변환
    const base64 = req.file.buffer.toString('base64');
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    // Gemini로 이미지 분석
    const analysis = await generator.analyzeSingleImage(imageDataUrl);
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: '이미지 분석 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// AI 파일명 분석 및 정렬 엔드포인트
app.post('/api/sort-filenames', upload.none(), async (req, res) => {
  try {
    let { filenames } = req.body;
    
    // JSON 문자열로 전송된 경우 파싱
    if (typeof filenames === 'string') {
      try {
        filenames = JSON.parse(filenames);
      } catch (parseError) {
        return res.status(400).json({
          error: '파일명 데이터 형식이 올바르지 않습니다.'
        });
      }
    }
    
    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        error: '파일명 배열이 필요합니다.'
      });
    }
    
    console.log('📋 AI 파일명 분석 시작:', filenames);
    
    // AI 파일명 분석을 위한 프롬프트
    const analysisResult = await generator.analyzeFilenames(filenames);
    
    res.json({
      success: true,
      data: analysisResult
    });
    
  } catch (error) {
    console.error('❌ 파일명 분석 오류:', error);
    res.status(500).json({
      error: '파일명 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 나레이션 생성 엔드포인트
app.post('/api/generate-narration', async (req, res) => {
  try {
    console.log('🔍 요청 헤더:', req.headers);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    console.log('🔍 Raw Body:', req.body);
    console.log('📋 나레이션 생성 요청 데이터:', JSON.stringify(req.body, null, 2));
    const { analysisResults, industry = 'wheel-restoration' } = req.body;
    
    if (!analysisResults || !Array.isArray(analysisResults) || analysisResults.length === 0) {
      console.log('❌ analysisResults 검증 실패:', { 
        exists: !!analysisResults, 
        isArray: Array.isArray(analysisResults), 
        length: analysisResults?.length 
      });
      return res.status(400).json({
        error: '분석 결과가 필요합니다.'
      });
    }
    
    console.log(`🎙️ 나레이션 생성 요청: ${analysisResults.length}개 제품, 업종: ${industry}`);
    
    // AI로 나레이션 생성
    const narrationData = await generator.generateNarration(analysisResults, industry);
    
    res.json({
      success: true,
      data: narrationData
    });
    
  } catch (error) {
    console.error('❌ 나레이션 생성 오류:', error);
    res.status(500).json({
      error: '나레이션 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배치 이미지 분석 엔드포인트
app.post('/api/analyze-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '분석할 이미지가 필요합니다.'
      });
    }
    
    const { sortMethod = 'ai' } = req.body;
    
    console.log(`🚀 배치 분석 시작: ${req.files.length}장, 정렬방식: ${sortMethod}`);
    
    // 파일명 추출
    const filenames = req.files.map(file => file.originalname);
    
    // AI로 파일명 분석하여 순서 결정
    let sortedIndices;
    if (sortMethod === 'ai') {
      const sortResult = await generator.analyzeFilenames(filenames);
      sortedIndices = sortResult.sortedOrder;
    } else if (sortMethod === 'time') {
      // 시간 기반 정렬 (파일명에서 시간 추출)
      sortedIndices = Array.from({ length: filenames.length }, (_, i) => i)
        .sort((a, b) => {
          const timeA = extractTimeFromFilename(filenames[a]);
          const timeB = extractTimeFromFilename(filenames[b]);
          return timeA - timeB;
        });
    } else {
      // 숫자 기반 정렬
      sortedIndices = Array.from({ length: filenames.length }, (_, i) => i)
        .sort((a, b) => {
          const numA = extractNumberFromFilename(filenames[a]);
          const numB = extractNumberFromFilename(filenames[b]);
          return numA - numB;
        });
    }
    
    // 정렬된 순서대로 이미지 분석
    const analysisResults = [];
    const batchSize = 3; // 동시 처리 개수
    
    for (let i = 0; i < sortedIndices.length; i += batchSize) {
      const batch = sortedIndices.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (fileIndex) => {
        const file = req.files[fileIndex];
        const base64 = file.buffer.toString('base64');
        const imageDataUrl = `data:${file.mimetype};base64,${base64}`;
        
        try {
          const analysis = await generator.analyzeSingleImage(imageDataUrl);
          return {
            filename: file.originalname,
            originalIndex: fileIndex,
            analysis: analysis,
            success: true
          };
        } catch (error) {
          return {
            filename: file.originalname,
            originalIndex: fileIndex,
            error: error.message,
            success: false
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      analysisResults.push(...batchResults);
    }
    
    res.json({
      success: true,
      totalImages: req.files.length,
      sortMethod: sortMethod,
      results: analysisResults
    });
    
  } catch (error) {
    console.error('❌ 배치 분석 오류:', error);
    res.status(500).json({
      error: '배치 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 통합 워크플로우 엔드포인트 (분석 + 정렬 + 나레이션)
app.post('/api/complete-workflow', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '분석할 이미지가 필요합니다.'
      });
    }
    
    const { sortMethod = 'ai', industry = 'wheel-restoration' } = req.body;
    
    console.log(`🚀 통합 워크플로우 시작: ${req.files.length}장, 정렬: ${sortMethod}, 업종: ${industry}`);
    
    const startTime = Date.now();
    
    // 1단계: 파일명 추출
    const filenames = req.files.map(file => file.originalname);
    
    // 2단계: AI로 파일명 분석하여 순서 결정
    let sortedIndices;
    if (sortMethod === 'ai') {
      const sortResult = await generator.analyzeFilenames(filenames);
      sortedIndices = sortResult.sortedOrder;
    } else if (sortMethod === 'time') {
      sortedIndices = Array.from({ length: filenames.length }, (_, i) => i)
        .sort((a, b) => {
          const timeA = extractTimeFromFilename(filenames[a]);
          const timeB = extractTimeFromFilename(filenames[b]);
          return timeA - timeB;
        });
    } else {
      sortedIndices = Array.from({ length: filenames.length }, (_, i) => i)
        .sort((a, b) => {
          const numA = extractNumberFromFilename(filenames[a]);
          const numB = extractNumberFromFilename(filenames[b]);
          return numA - numB;
        });
    }
    
    // 3단계: 정렬된 순서대로 이미지 분석
    const analysisResults = [];
    const batchSize = 3;
    
    for (let i = 0; i < sortedIndices.length; i += batchSize) {
      const batch = sortedIndices.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (fileIndex) => {
        const file = req.files[fileIndex];
        const base64 = file.buffer.toString('base64');
        const imageDataUrl = `data:${file.mimetype};base64,${base64}`;
        
        try {
          const analysis = await generator.analyzeSingleImage(imageDataUrl);
          return {
            filename: file.originalname,
            originalIndex: fileIndex,
            analysis: analysis,
            success: true
          };
        } catch (error) {
          return {
            filename: file.originalname,
            originalIndex: fileIndex,
            error: error.message,
            success: false
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      analysisResults.push(...batchResults);
    }
    
    // 4단계: 나레이션 생성
    const narrationData = await generator.generateNarration(analysisResults, industry);
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    res.json({
      success: true,
      workflow: {
        totalImages: req.files.length,
        sortMethod: sortMethod,
        industry: industry,
        processingTime: totalTime
      },
      analysis: {
        results: analysisResults,
        successCount: analysisResults.filter(r => r.success).length,
        failCount: analysisResults.filter(r => !r.success).length
      },
      narration: narrationData
    });
    
  } catch (error) {
    console.error('❌ 통합 워크플로우 오류:', error);
    res.status(500).json({
      error: '워크플로우 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 파일명에서 시간 추출 헬퍼 함수
function extractTimeFromFilename(filename) {
  // 다양한 시간 형식 지원 (20240101_123456, 2024-01-01-12-34-56, 등)
  const timePatterns = [
    /(\d{4})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})[\-_]?(\d{2})/,
    /(\d{8})[\-_]?(\d{6})/,
    /(\d{13,14})/ // Unix timestamp
  ];
  
  for (const pattern of timePatterns) {
    const match = filename.match(pattern);
    if (match) {
      if (match[0].length >= 13) {
        // Unix timestamp
        return parseInt(match[0]);
      } else {
        // 날짜 시간 형식을 timestamp로 변환
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
  
  return 0; // 시간 정보가 없으면 0 반환
}

// 파일명에서 숫자 추출 헬퍼 함수
function extractNumberFromFilename(filename) {
  // 파일명에서 첫 번째 숫자를 추출
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Enhanced video generation endpoint with 2-stage narration support
app.post('/api/generate-video', upload.array('images', 10), async (req, res) => {
  try {
    const { 
      productName, 
      industry = 'wheel-restoration', 
      style = 'dynamic',
      analysisResults,
      finalStory,
      duration = 30
    } = req.body;
    
    console.log('🎬 비디오 생성 요청 수신:', {
      productName,
      industry,
      imageCount: req.files ? req.files.length : 0,
      hasAnalysisResults: !!analysisResults,
      hasFinalStory: !!finalStory
    });
    
    // 입력 데이터 검증
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ 
        error: '최소 3장의 이미지가 필요합니다.' 
      });
    }
    
    if (!productName) {
      return res.status(400).json({ 
        error: '상품명을 입력해주세요.' 
      });
    }
    
    if (!finalStory) {
      return res.status(400).json({ 
        error: '3단계 AI 프로세스를 완료한 후 영상을 생성할 수 있습니다.' 
      });
    }
    
    // 이미지 데이터 처리
    const imageDataUrls = req.files.map(file => {
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    });
    
    // 나레이션 데이터 파싱
    let parsedAnalysisResults, parsedFinalStory;
    try {
      parsedAnalysisResults = typeof analysisResults === 'string' ? 
        JSON.parse(analysisResults) : analysisResults;
      parsedFinalStory = typeof finalStory === 'string' ? 
        JSON.parse(finalStory) : finalStory;
    } catch (parseError) {
      return res.status(400).json({
        error: '나레이션 데이터 형식이 올바르지 않습니다.',
        details: parseError.message
      });
    }
    
    console.log('📊 처리할 데이터:', {
      analysisCount: parsedAnalysisResults ? parsedAnalysisResults.length : 0,
      storySegments: parsedFinalStory.segments ? parsedFinalStory.segments.length : 0,
      fullStoryExists: !!parsedFinalStory.fullStoryData
    });
    
    // 향상된 비디오 생성
    const result = await generator.generateEnhancedVideo({
      images: imageDataUrls,
      productName,
      industry,
      style,
      analysisResults: parsedAnalysisResults,
      storyData: parsedFinalStory,
      duration
    });
    
    res.json({
      success: true,
      message: '✅ 쇼츠 비디오 생성 완료!',
      filename: result.filename,
      outputPath: `/output/${result.filename}`,  // 웹 경로로 변경
      videoUrl: `/output/${result.filename}`,    // 다운로드 링크
      duration: result.duration,
      metadata: result.metadata
    });
    
  } catch (error) {
    console.error('❌ 비디오 생성 오류:', error);
    res.status(500).json({ 
      error: '비디오 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// Legacy endpoint for backwards compatibility
app.post('/api/generate', upload.array('images', 10), async (req, res) => {
  try {
    const { productName, style = 'dynamic', industry = 'wheel-restoration' } = req.body;
    
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ 
        error: '최소 3장의 이미지가 필요합니다.' 
      });
    }
    
    if (!productName) {
      return res.status(400).json({ 
        error: '상품명을 입력해주세요.' 
      });
    }
    
    // Convert uploaded files to data URLs
    const imageDataUrls = req.files.map(file => {
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    });
    
    // Generate video using legacy method
    console.log(`🚀 Legacy video generation for: ${productName}`);
    const result = await generator.generate(imageDataUrls, productName, style);
    
    res.json({
      success: true,
      message: '쇼츠 생성 완료!',
      data: result
    });
    
  } catch (error) {
    console.error('Error generating shorts:', error);
    res.status(500).json({ 
      error: '쇼츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// Get generated videos
app.get('/api/videos', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const outputDir = path.join(__dirname, 'output');
    
    try {
      const files = await fs.readdir(outputDir);
      const videos = files
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({
          name: f,
          path: `/output/${f}`,
          created: new Date().toISOString() // In production, get actual file stats
        }));
      
      res.json({ videos });
    } catch {
      res.json({ videos: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// FFmpeg 전환 효과 테스트 API
// ===========================================

// 기본 전환 효과 테스트
app.post('/api/test-transitions', upload.array('images', 10), async (req, res) => {
  try {
    const { transitionType, duration = 2, transitionDuration = 1 } = req.body;
    
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ 
        error: '최소 2장의 이미지가 필요합니다.' 
      });
    }
    
    console.log(`🎬 ${transitionType} 전환 효과 테스트 시작`);
    
    const result = await generator.testTransitionEffect({
      images: req.files,
      transitionType,
      duration: parseFloat(duration),
      transitionDuration: parseFloat(transitionDuration)
    });
    
    res.json({
      success: true,
      filename: result.filename,
      duration: result.duration,
      processingTime: result.processingTime,
      transitionType: transitionType
    });
    
  } catch (error) {
    console.error('❌ 전환 효과 테스트 오류:', error);
    res.status(500).json({ 
      error: '전환 효과 테스트 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 복합 전환 효과 테스트
app.post('/api/test-complex-transitions', upload.array('images', 10), async (req, res) => {
  try {
    const { styleType, duration = 3, transitionDuration = 1.5 } = req.body;
    
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ 
        error: '최소 3장의 이미지가 필요합니다.' 
      });
    }
    
    console.log(`🎪 ${styleType} 복합 전환 효과 테스트 시작`);
    
    const result = await generator.testComplexTransitions({
      images: req.files,
      styleType,
      duration: parseFloat(duration),
      transitionDuration: parseFloat(transitionDuration)
    });
    
    res.json({
      success: true,
      filename: result.filename,
      duration: result.duration,
      processingTime: result.processingTime,
      styleType: styleType,
      effects: result.effects
    });
    
  } catch (error) {
    console.error('❌ 복합 전환 효과 테스트 오류:', error);
    res.status(500).json({ 
      error: '복합 전환 효과 테스트 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 전환 효과 비교 테스트
app.post('/api/compare-transitions', upload.array('images', 10), async (req, res) => {
  try {
    const { effects } = req.body;
    const effectsList = typeof effects === 'string' ? JSON.parse(effects) : effects;
    
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ 
        error: '최소 2장의 이미지가 필요합니다.' 
      });
    }
    
    console.log(`⚖️ ${effectsList.length}개 전환 효과 비교 시작`);
    
    const result = await generator.compareTransitionEffects({
      images: req.files,
      effects: effectsList,
      duration: 2,
      transitionDuration: 1
    });
    
    res.json({
      success: true,
      results: result.results,
      totalProcessingTime: result.totalProcessingTime
    });
    
  } catch (error) {
    console.error('❌ 전환 효과 비교 오류:', error);
    res.status(500).json({ 
      error: '전환 효과 비교 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 간단한 비디오 테스트 API
app.post('/api/test-simple-video', upload.array('images', 10), async (req, res) => {
  try {
    const { duration = 3 } = req.body;
    
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ 
        error: '최소 2장의 이미지가 필요합니다.' 
      });
    }
    
    console.log('🧪 간단한 비디오 테스트 시작');
    
    // 임시 이미지 저장
    await generator.init();
    const imagePaths = await generator.saveUploadedImages(req.files);
    
    // 간단한 비디오 생성
    const result = await generator.generateSimpleVideo(imagePaths, {
      duration: parseFloat(duration),
      outputName: `test_simple_${Date.now()}.mp4`
    });
    
    // 임시 파일 정리
    await generator.cleanupTempFiles(imagePaths);
    
    res.json({
      success: true,
      filename: result.filename,
      message: '간단한 비디오 생성 완료',
      downloadUrl: `/output/${result.filename}`
    });
    
  } catch (error) {
    console.error('❌ 간단한 비디오 테스트 오류:', error);
    res.status(500).json({ 
      error: '간단한 비디오 테스트 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 나레이션 포함 비디오 테스트 API
app.post('/api/test-video-with-narration', upload.array('images', 10), async (req, res) => {
  try {
    const { duration = 3, narrationText = "안녕하세요! 이것은 테스트 나레이션입니다. AI가 생성한 음성으로 비디오를 만들어 보겠습니다." } = req.body;
    
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ 
        error: '최소 2장의 이미지가 필요합니다.' 
      });
    }
    
    const { productTitle = "휠 복원 테스트" } = req.body; // 제품 제목 추가
    
    console.log('🎙️ 나레이션 포함 비디오 테스트 시작');
    console.log('제품 제목:', productTitle);
    console.log('나레이션 텍스트:', narrationText);
    console.log('이미지 개수:', req.files.length);
    
    let imagePaths = [];
    
    try {
      // 임시 이미지 저장
      await generator.init();
      imagePaths = await generator.saveUploadedImages(req.files);
      console.log('✅ 이미지 저장 완료:', imagePaths.length);
      
      // 나레이션 포함 비디오 생성
      const result = await generator.generateVideoWithNarration(imagePaths, narrationText, {
        duration: parseFloat(duration),
        outputName: `test_narration_${Date.now()}`
      });
      
      console.log('✅ 나레이션 비디오 생성 완료:', result);
      
      res.json({
        success: true,
        filename: result.filename,
        hasAudio: result.hasAudio,
        message: `나레이션 ${result.hasAudio ? '포함' : '없는'} 비디오 생성 완료`,
        downloadUrl: `/output/${result.filename}`,
        narrationText: narrationText
      });
      
    } finally {
      // 임시 파일 정리 (오류 발생 시에도 실행)
      if (imagePaths.length > 0) {
        try {
          await generator.cleanupTempFiles(imagePaths);
          console.log('✅ 임시 파일 정리 완료');
        } catch (cleanupError) {
          console.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 나레이션 비디오 테스트 오류:', error);
    
    // JSON 응답을 확실히 반환
    if (!res.headersSent) {
      res.status(500).json({ 
        error: '나레이션 비디오 테스트 중 오류가 발생했습니다.',
        details: error.message 
      });
    }
  }
});

// Serve generated videos
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   AI 쇼츠 제작 공장 서버 시작됨!      ║
╚══════════════════════════════════════╝
    
🚀 서버 주소: http://localhost:${PORT}
📊 API 상태: http://localhost:${PORT}/api/health
🎬 웹 인터페이스: http://localhost:${PORT}

환경 변수:
- GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 필요'}
- ELEVENLABS_API_KEY: ${process.env.ELEVENLABS_API_KEY ? '✅ 설정됨' : '⚠️ 선택'}
  `);
});