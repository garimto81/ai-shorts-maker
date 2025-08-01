#!/usr/bin/env node

/**
 * GitHub Actions용 비디오 생성 스크립트
 * Issue에서 정보를 읽어 AI Shorts 비디오를 생성합니다
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  options[key] = value;
}

// 출력 디렉토리 생성
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 임시 디렉토리 생성
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * 이미지 다운로드
 */
async function downloadImage(url, index) {
  console.log(`📥 이미지 다운로드 중 ${index + 1}: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.buffer();
    const ext = path.extname(url) || '.jpg';
    const filename = path.join(tempDir, `image_${index}${ext}`);
    
    fs.writeFileSync(filename, buffer);
    console.log(`✅ 다운로드 완료: ${filename}`);
    
    return filename;
  } catch (error) {
    console.error(`❌ 이미지 다운로드 실패: ${error.message}`);
    throw error;
  }
}


/**
 * AI 스크립트 생성 (제목 기반)
 */
async function generateScript(title) {
  console.log('📝 AI 스크립트 생성 중...');
  
  const response = await fetch('http://localhost:3000/api/scripts/auto-generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      description: title, // 제목을 설명으로도 사용
      category: 'promotional',
      difficulty: 'beginner'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ 스크립트 생성 완료');
    return result.data.content;
  } else {
    throw new Error('스크립트 생성 실패');
  }
}

/**
 * TTS 음성 생성 (기본 energetic 스타일)
 */
async function generateAudio(text) {
  console.log('🎙️ TTS 음성 생성 중...');
  
  const response = await fetch('http://localhost:3000/api/tts/energetic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      emotion: 'excited',
      intensity: 'medium'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ 음성 생성 완료');
    
    // 음성 파일 다운로드
    const audioResponse = await fetch(`http://localhost:3000${result.data.audioUrl}`);
    const audioBuffer = await audioResponse.buffer();
    const audioPath = path.join(tempDir, 'narration.mp3');
    fs.writeFileSync(audioPath, audioBuffer);
    
    return audioPath;
  } else {
    throw new Error('음성 생성 실패');
  }
}

/**
 * 비디오 렌더링 (간단한 FFmpeg 명령)
 */
async function renderVideo(imagePaths, audioPath, outputPath) {
  console.log('🎬 비디오 렌더링 중...');
  
  const { spawn } = require('child_process');
  
  // 이미지 파일 리스트 생성
  const listFile = path.join(tempDir, 'images.txt');
  const fileList = imagePaths.map(img => `file '${img}'`).join('\n');
  fs.writeFileSync(listFile, fileList);
  
  // 각 이미지 표시 시간 계산 (오디오 길이에 맞춤)
  const audioDuration = 30; // 예시: 30초
  const imageDuration = audioDuration / imagePaths.length;
  
  // FFmpeg 명령 실행
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-i', audioPath,
    '-vf', `scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setpts=${imageDuration}/TB`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-y',
    outputPath
  ]);
  
  return new Promise((resolve, reject) => {
    ffmpeg.stdout.on('data', (data) => {
      console.log(`FFmpeg: ${data}`);
    });
    
    ffmpeg.stderr.on('data', (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 비디오 렌더링 완료');
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg 종료 코드: ${code}`));
      }
    });
  });
}

/**
 * 메인 함수
 */
async function main() {
  try {
    console.log('🚀 AI Shorts 비디오 생성 시작');
    console.log('📋 옵션:', options);
    
    // 1. 이미지 다운로드
    const imageUrls = JSON.parse(options.images || '[]');
    if (imageUrls.length === 0) {
      throw new Error('이미지 URL이 제공되지 않았습니다');
    }
    
    const imagePaths = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imagePath = await downloadImage(imageUrls[i], i);
      imagePaths.push(imagePath);
    }
    
    // 2. 스크립트 생성 (API 키가 있는 경우)
    let scriptText = options.title; // 기본은 제목 사용
    if (process.env.GOOGLE_AI_API_KEY) {
      const script = await generateScript(options.title);
      scriptText = script.narration || scriptText;
    }
    
    // 3. 음성 생성
    const audioPath = await generateAudio(scriptText);
    
    // 4. 비디오 렌더링
    const outputPath = path.join(outputDir, 'video.mp4');
    await renderVideo(imagePaths, audioPath, outputPath);
    
    console.log('🎉 비디오 생성 완료!');
    console.log(`📁 출력 파일: ${outputPath}`);
    
    // 5. 임시 파일 정리
    console.log('🧹 임시 파일 정리 중...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 로컬 개발 환경에서는 실제 API 대신 시뮬레이션
if (!process.env.GOOGLE_AI_API_KEY) {
  console.log('⚠️  API 키가 없어 시뮬레이션 모드로 실행됩니다');
  
  // 더미 비디오 파일 생성
  const dummyVideo = path.join(outputDir, 'video.mp4');
  fs.writeFileSync(dummyVideo, 'Dummy video content');
  console.log('✅ 더미 비디오 생성 완료');
  process.exit(0);
} else {
  main();
}