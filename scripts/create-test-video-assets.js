// 영상 테스트용 이미지와 음성 파일 생성 스크립트

const fs = require('fs');
const path = require('path');

// Canvas API 모킹 (Node.js 환경용)
let createCanvas = null;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
} catch (error) {
  console.warn('canvas 패키지가 설치되지 않았습니다. 간단한 SVG 파일을 생성합니다.');
  createCanvas = null;
}

// 테스트 이미지 생성
function createTestImages() {
  const testDir = path.join(__dirname, '..', 'public', 'test-video-assets');
  
  // 디렉토리 생성
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const colors = [
    { bg: '#FF6B6B', text: '#FFFFFF', name: '빨간색' },
    { bg: '#4ECDC4', text: '#FFFFFF', name: '청록색' },
    { bg: '#45B7D1', text: '#FFFFFF', name: '파란색' },
    { bg: '#96CEB4', text: '#FFFFFF', name: '녹색' },
    { bg: '#FFEAA7', text: '#2D3436', name: '노란색' },
    { bg: '#DDA0DD', text: '#FFFFFF', name: '보라색' },
    { bg: '#FFB6C1', text: '#2D3436', name: '분홍색' },
    { bg: '#F0E68C', text: '#2D3436', name: '카키색' }
  ];

  if (createCanvas) {
    // Canvas를 사용한 고품질 이미지 생성
    colors.forEach((color, index) => {
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      
      // 배경 색상
      ctx.fillStyle = color.bg;
      ctx.fillRect(0, 0, 800, 600);
      
      // 텍스트
      ctx.fillStyle = color.text;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(`이미지 ${index + 1}`, 400, 250);
      ctx.fillText(color.name, 400, 320);
      
      // 시간 표시
      ctx.font = '24px Arial';
      ctx.fillText(`테스트용 이미지 ${String(index + 1).padStart(2, '0')}`, 400, 380);
      
      // 파일 저장
      const buffer = canvas.toBuffer('image/png');
      const filename = `test_image_${String(index + 1).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(testDir, filename), buffer);
      
      console.log(`✅ 생성됨: ${filename}`);
    });
  } else {
    // SVG를 사용한 간단한 이미지 생성
    colors.forEach((color, index) => {
      const svg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="${color.bg}"/>
          <text x="400" y="250" font-family="Arial" font-size="48" font-weight="bold" 
                text-anchor="middle" fill="${color.text}">이미지 ${index + 1}</text>
          <text x="400" y="320" font-family="Arial" font-size="48" font-weight="bold" 
                text-anchor="middle" fill="${color.text}">${color.name}</text>
          <text x="400" y="380" font-family="Arial" font-size="24" 
                text-anchor="middle" fill="${color.text}">테스트용 이미지 ${String(index + 1).padStart(2, '0')}</text>
        </svg>
      `.trim();
      
      const filename = `test_image_${String(index + 1).padStart(2, '0')}.svg`;
      fs.writeFileSync(path.join(testDir, filename), svg);
      
      console.log(`✅ 생성됨: ${filename}`);
    });
  }
}

// 테스트용 음성 스크립트 생성 (TTS용)
function createTestAudioScript() {
  const testDir = path.join(__dirname, '..', 'public', 'test-video-assets');
  
  const audioScript = {
    title: "테스트 영상 나레이션",
    content: "안녕하세요! 이것은 AI Shorts Maker의 영상 합성 테스트입니다. 여러 가지 색상의 이미지들이 순서대로 나타날 것입니다. 각 이미지는 2초씩 표시되며, 이 음성과 함께 최종 영상으로 합성됩니다. 빨간색, 청록색, 파란색, 녹색, 노란색, 보라색, 분홍색, 카키색 순서로 표시됩니다. 테스트가 완료되면 MP4 파일로 다운로드할 수 있습니다.",
    duration_estimate: 16, // 초
    voice_settings: {
      speed: 1.0,
      pitch: 1.0,
      language: "ko-KR"
    }
  };

  fs.writeFileSync(
    path.join(testDir, 'test_audio_script.json'), 
    JSON.stringify(audioScript, null, 2)
  );

  console.log('✅ 생성됨: test_audio_script.json');
}

// README 파일 생성
function createReadme() {
  const testDir = path.join(__dirname, '..', 'public', 'test-video-assets');
  
  const readme = `# 테스트용 영상 에셋

이 폴더에는 영상+음성 합성 기능을 테스트하기 위한 파일들이 있습니다.

## 파일 목록

### 이미지 파일
- test_image_01.png (빨간색)
- test_image_02.png (청록색) 
- test_image_03.png (파란색)
- test_image_04.png (녹색)
- test_image_05.png (노란색)
- test_image_06.png (보라색)
- test_image_07.png (분홍색)
- test_image_08.png (카키색)

### 음성 스크립트
- test_audio_script.json

## 사용법

1. \`/video-audio-test\` 페이지로 이동
2. 이미지 파일들을 모두 선택하여 업로드
3. TTS 기능을 사용하여 test_audio_script.json의 내용으로 음성 생성
4. 또는 별도의 음성 파일 업로드
5. 렌더링 모드 선택 후 '영상 생성 시작' 클릭

## 예상 결과

- 총 영상 길이: 16초 (8개 이미지 × 2초)
- 해상도: 설정에 따라 가변
- 형식: 선택한 출력 형식

## 트러블슈팅

### FFmpeg 모드가 작동하지 않는 경우
- 브라우저에서 SharedArrayBuffer 지원 확인
- HTTPS 환경에서 실행 (localhost 제외)
- Cross-Origin-Embedder-Policy 헤더 확인

### 브라우저 모드 오류
- MediaRecorder API 지원 브라우저 사용
- Canvas.captureStream() 지원 확인
- 최신 Chrome/Firefox 사용 권장

생성일: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(testDir, 'README.md'), readme);
  console.log('✅ 생성됨: README.md');
}

// 메인 실행
function main() {
  console.log('🎬 테스트용 영상 에셋 생성 시작...');
  
  try {
    createTestImages();
    createTestAudioScript();
    createReadme();
    
    console.log('\n✅ 모든 테스트 에셋 생성 완료!');
    console.log('📁 위치: public/test-video-assets/');
    console.log('🚀 테스트 페이지: http://localhost:3000/video-audio-test');
    
  } catch (error) {
    console.error('❌ 에셋 생성 실패:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  main();
}

module.exports = {
  createTestImages,
  createTestAudioScript,
  createReadme,
  main
};