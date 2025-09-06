import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ShortsGenerator from './scripts/process-video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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