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
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
app.post('/api/sort-filenames', async (req, res) => {
  try {
    const { filenames } = req.body;
    
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
    const { analysisResults, industry = 'auto' } = req.body;
    
    if (!analysisResults || !Array.isArray(analysisResults) || analysisResults.length === 0) {
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
    
    const { sortMethod = 'ai', industry = 'auto' } = req.body;
    
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

// Generate shorts endpoint
app.post('/api/generate', upload.array('images', 10), async (req, res) => {
  try {
    const { productName, style = 'dynamic', industry = 'auto' } = req.body;
    
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
    
    // Generate video
    console.log(`🚀 Generating shorts for: ${productName}`);
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