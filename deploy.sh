#!/bin/bash

echo "🚀 AI Shorts Maker 배포 시작..."

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 빌드
echo "🔨 프로젝트 빌드 중..."
npm run build

# 3. Vercel에 배포
echo "☁️  Vercel에 배포 중..."
npx vercel --prod --force --yes

echo "✅ 배포 완료!"
echo "🌐 https://ai-shorts-maker.vercel.app 에서 확인하세요"