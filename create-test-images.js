// 테스트 이미지 생성 스크립트
const fs = require('fs');
const path = require('path');

// 테스트 이미지 디렉토리 생성
const testImagesDir = path.join(__dirname, 'public', 'test-images');
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

// 색상 팔레트
const colorPalettes = {
  nature: ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'],
  tech: ['#0288D1', '#03A9F4', '#4FC3F7', '#81D4FA', '#B3E5FC'],
  food: ['#F57C00', '#FF9800', '#FFB74D', '#FFCC80', '#FFE0B2'],
  abstract: ['#6A1B9A', '#8E24AA', '#AB47BC', '#CE93D8', '#E1BEE7']
};

// SVG 기반 이미지 생성 함수
function createTestImage(category, index, width = 1080, height = 1920) {
  const colors = colorPalettes[category];
  
  // 카테고리별 텍스트
  const texts = {
    nature: ['자연', '숲', '바다', '하늘', '꽃'],
    tech: ['AI', '미래', '혁신', '디지털', '기술'],
    food: ['맛있는', '요리', '디저트', '건강', '음식'],
    abstract: ['예술', '창의', '디자인', '패턴', '색상']
  };
  
  // 랜덤 원들 생성
  let circles = '';
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 50 + Math.random() * 200;
    circles += `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[1]}" opacity="0.3" />`;
  }
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${category}${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors[2]};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
      <feOffset dx="5" dy="5" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 배경 -->
  <rect width="${width}" height="${height}" fill="url(#grad${category}${index})" />
  
  <!-- 패턴 -->
  ${circles}
  
  <!-- 메인 텍스트 -->
  <text x="${width/2}" y="${height/2 - 100}" 
        font-family="Arial, sans-serif" 
        font-size="120" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="white"
        filter="url(#shadow)">
    ${texts[category][index - 1]}
  </text>
  
  <!-- 부제목 -->
  <text x="${width/2}" y="${height/2 + 50}" 
        font-family="Arial, sans-serif" 
        font-size="60" 
        text-anchor="middle" 
        fill="white"
        filter="url(#shadow)">
    샘플 이미지 ${index}
  </text>
  
  <!-- 프레임 -->
  <rect x="100" y="100" width="${width - 200}" height="${height - 200}" 
        stroke="white" stroke-width="5" fill="none" />
  
  <!-- 카테고리 표시 -->
  <text x="${width/2}" y="${height - 150}" 
        font-family="Arial, sans-serif" 
        font-size="40" 
        text-anchor="middle" 
        fill="white"
        opacity="0.8">
    ${category.toUpperCase()} CATEGORY
  </text>
</svg>`;
  
  // 파일로 저장
  const filename = `${category}${index}.svg`;
  const filepath = path.join(testImagesDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ 생성됨: ${filename}`);
}

// 각 카테고리별로 5개씩 이미지 생성
console.log('🎨 테스트 이미지 생성 시작...\n');

Object.keys(colorPalettes).forEach(category => {
  console.log(`📁 ${category} 카테고리:`);
  for (let i = 1; i <= 5; i++) {
    createTestImage(category, i);
  }
  console.log('');
});

console.log('✨ 모든 테스트 이미지가 생성되었습니다!');
console.log(`📍 위치: ${testImagesDir}`);

