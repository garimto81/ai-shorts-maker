import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  // 이미지 다운로드 및 압축
  async processImage(imageUrl, index) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(this.tempDir, `temp_${index}.jpg`);
      const file = fs.createWriteStream(tempPath);
      
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on('finish', async () => {
          file.close();
          
          try {
            // 이미지 정보 확인
            const metadata = await sharp(tempPath).metadata();
            const fileSize = (await fs.stat(tempPath)).size;
            
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
                
                const compressedSize = (await fs.stat(outputPath)).size;
                if (compressedSize < 1024 * 1024) {
                  compressed = true;
                } else {
                  quality -= 10;
                }
              }
            } else {
              // 이미 1MB 이하면 그대로 복사
              await fs.copyFile(tempPath, outputPath);
            }
            
            // 임시 파일 삭제
            await fs.unlink(tempPath);
            
            resolve(outputPath);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  // Gemini로 이미지 분석
  async analyzeImages(imagePaths, productName) {
    console.log('🔍 Analyzing images with Gemini Vision...');
    
    const imagePromises = imagePaths.map(async (imagePath) => {
      const imageData = await fs.readFile(imagePath);
      return {
        inlineData: {
          data: imageData.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
    });
    
    const images = await Promise.all(imagePromises);
    
    const prompt = `
      당신은 전문 마케팅 분석가입니다. 
      제품명: ${productName}
      
      이 이미지들을 분석하여 다음을 제공해주세요:
      
      1. 제품의 주요 특징 3가지
      2. 타겟 고객층 분석
      3. 핵심 판매 포인트
      4. 추천 마케팅 메시지
      5. 적합한 배경음악 스타일
      
      JSON 형식으로 응답해주세요.
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
      features: ['프리미엄 품질', '세련된 디자인', '실용적 기능'],
      targetAudience: '20-40대 품질 중시 고객',
      sellingPoints: '최고의 가성비',
      marketingMessage: `${productName} - 당신의 최고의 선택`,
      musicStyle: 'upbeat'
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
      
      await fs.writeFile(
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