// 간단한 테스트용 이미지 생성 스크립트 (SVG 사용)
const fs = require('fs');
const path = require('path');

// 테스트 이미지 저장 디렉토리
const testImagesDir = path.join(__dirname, '../public/test-images');

// 디렉토리 생성
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

// 색상과 텍스트로 간단한 SVG 이미지 생성
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
const titles = ['시작', '중간 1', '중간 2', '중간 3', '끝'];

function createTestImageSVG(index, color, title) {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="480" fill="${color}"/>
  <text x="320" y="200" font-family="Arial" font-size="60" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
  <text x="320" y="280" font-family="Arial" font-size="40" fill="white" text-anchor="middle">테스트 이미지 ${index + 1}</text>
  <text x="320" y="350" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${new Date().toLocaleDateString('ko-KR')}</text>
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
  createTestImageSVG(i, colors[i], titles[i]);
}

// 리스트 파일 확인
const files = fs.readdirSync(testImagesDir);
console.log('\n📋 생성된 파일 목록:');
files.forEach(file => {
  const stats = fs.statSync(path.join(testImagesDir, file));
  console.log(`  - ${file} (${stats.size} bytes)`);
});

console.log('\n✨ 테스트 이미지 생성 완료!');