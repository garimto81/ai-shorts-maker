const fs = require('fs');
const path = require('path');

// out 디렉토리에 .nojekyll 파일 복사
const sourceNojekyll = path.join(__dirname, '..', 'public', '.nojekyll');
const destNojekyll = path.join(__dirname, '..', 'out', '.nojekyll');

// out 디렉토리가 존재하는지 확인
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// .nojekyll 파일 복사
if (fs.existsSync(sourceNojekyll)) {
  fs.copyFileSync(sourceNojekyll, destNojekyll);
  console.log('✅ .nojekyll 파일이 out 디렉토리로 복사되었습니다.');
}

// 404.html을 index.html로 복사 (SPA 라우팅 지원)
const source404 = path.join(outDir, '404.html');
const destIndex = path.join(outDir, 'index.html');

if (fs.existsSync(source404) && !fs.existsSync(destIndex)) {
  fs.copyFileSync(source404, destIndex);
  console.log('✅ 404.html이 index.html로 복사되었습니다.');
}

console.log('✅ GitHub Pages 배포 준비가 완료되었습니다.');