// 테스트용 이미지 생성 스크립트
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 테스트 이미지 저장 디렉토리
const testImagesDir = path.join(__dirname, '../public/test-images');

// 디렉토리 생성
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

// 색상과 텍스트로 간단한 이미지 생성
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
const titles = ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4', 'Scene 5'];

async function createTestImage(index, color, title) {
  try {
    const canvas = createCanvas(640, 480);
    const ctx = canvas.getContext('2d');
    
    // 배경색
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 640, 480);
    
    // 텍스트
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 320, 240);
    
    // 작은 텍스트
    ctx.font = '24px Arial';
    ctx.fillText(`Test Image ${index + 1}`, 320, 300);
    
    // 파일로 저장
    const filename = `test-image-${String(index + 1).padStart(2, '0')}.png`;
    const filepath = path.join(testImagesDir, filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    
    console.log(`✅ 생성됨: ${filename}`);
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  }
}

// 대체 방법: Canvas 없이 SVG로 이미지 생성
function createTestImageSVG(index, color, title) {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="480" fill="${color}"/>
  <text x="320" y="240" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
  <text x="320" y="300" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Test Image ${index + 1}</text>
</svg>`;
  
  const filename = `test-image-${String(index + 1).padStart(2, '0')}.svg`;
  const filepath = path.join(testImagesDir, filename);
  fs.writeFileSync(filepath, svgContent);
  
  console.log(`✅ SVG 생성됨: ${filename}`);
}

// 테스트 이미지 생성
console.log('🎨 테스트 이미지 생성 중...');
console.log(`📁 저장 위치: ${testImagesDir}`);

for (let i = 0; i < 5; i++) {
  // SVG로 생성 (Canvas 없이)
  createTestImageSVG(i, colors[i], titles[i]);
}

console.log('\n✨ 테스트 이미지 생성 완료!');