// SVG를 PNG로 변환하는 스크립트
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const testImagesDir = path.join(__dirname, '../public/test-images');

async function convertSvgToPng() {
  const svgFiles = fs.readdirSync(testImagesDir).filter(f => f.endsWith('.svg'));
  
  console.log(`🔄 ${svgFiles.length}개의 SVG 파일을 PNG로 변환 중...`);
  
  for (const svgFile of svgFiles) {
    try {
      const svgPath = path.join(testImagesDir, svgFile);
      const pngFile = svgFile.replace('.svg', '.png');
      const pngPath = path.join(testImagesDir, pngFile);
      
      // SVG를 PNG로 변환
      await sharp(svgPath)
        .png()
        .toFile(pngPath);
      
      console.log(`✅ 변환 완료: ${svgFile} → ${pngFile}`);
    } catch (error) {
      console.error(`❌ 변환 실패 ${svgFile}:`, error.message);
    }
  }
  
  console.log('\n✨ PNG 변환 완료!');
}

convertSvgToPng().catch(console.error);