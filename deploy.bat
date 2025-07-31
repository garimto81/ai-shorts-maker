@echo off
echo 🚀 AI Shorts Maker 배포 시작...

echo 📦 의존성 설치 중...
call npm install

echo 🔨 프로젝트 빌드 중...
call npm run build

echo ☁️ Vercel에 배포 중...
call npx vercel --prod --force --yes

echo ✅ 배포 완료!
echo 🌐 https://ai-shorts-maker.vercel.app 에서 확인하세요
pause