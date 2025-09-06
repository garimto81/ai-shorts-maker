# 🚀 AI 쇼츠 제작 공장 - 빠른 시작 가이드

## 📋 필수 준비사항

### 1. Gemini API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 생성된 API 키 복사

### 2. GitHub Secrets 설정
1. GitHub 리포지토리 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 다음 시크릿 추가:
   - Name: `GEMINI_API_KEY`
   - Value: [복사한 Gemini API 키]

## 🎯 3가지 사용 방법

### 방법 1: GitHub Pages (가장 쉬움)
```bash
# 1. GitHub Pages 활성화
Settings → Pages → Source: Deploy from a branch → Branch: main → Save

# 2. 접속
https://[username].github.io/ai-shorts-maker/
```

### 방법 2: 로컬 실행
```bash
# 1. 클론
git clone https://github.com/garimto81/ai-shorts-maker.git
cd ai-shorts-maker

# 2. 환경 설정
cp .env.example .env
# .env 파일에 GEMINI_API_KEY 입력

# 3. 의존성 설치
npm install

# 4. 서버 실행
node server.js

# 5. 브라우저에서 열기
http://localhost:3000
```

### 방법 3: GitHub Actions (서버리스)
1. Actions 탭 → "Process Video with AI"
2. Run workflow 클릭
3. 입력:
   - images: `https://example.com/img1.jpg,https://example.com/img2.jpg`
   - product_name: `테스트 상품`
   - style: `dynamic`

## ⚡ 빠른 테스트

### 테스트용 이미지 URL
```
https://picsum.photos/1920/1080?random=1
https://picsum.photos/1920/1080?random=2
https://picsum.photos/1920/1080?random=3
```

### 테스트 명령어
```bash
node scripts/process-video.js \
  --images="https://picsum.photos/1920/1080?random=1,https://picsum.photos/1920/1080?random=2,https://picsum.photos/1920/1080?random=3" \
  --product="테스트 상품" \
  --style="dynamic"
```

## 🔧 트러블슈팅

### FFmpeg 설치 안됨
```bash
# Windows
winget install ffmpeg

# Mac
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg
```

### Gemini API 오류
- API 키 확인
- 할당량 확인 (무료: 분당 15 요청)
- [Google AI Studio](https://makersuite.google.com/app/apikey)에서 상태 확인

### 이미지 처리 오류
- 이미지 크기: 10MB 이하
- 형식: JPG, PNG만 지원
- 최소 3장 필요

## 📊 API 사용량

### 무료 할당량
- Gemini 1.5 Flash: 분당 15 요청
- 일일 1,500 요청
- 이미지당 약 $0.002

### 예상 비용
- 쇼츠 1개: ~$0.01
- 일일 100개: ~$1.00
- 월간 3,000개: ~$30.00

## 🎬 생성된 영상 확인

### 로컬
```
output/ 폴더에서 확인
```

### GitHub Actions
```
Actions → 워크플로우 선택 → Artifacts에서 다운로드
```

## 💡 팁

1. **이미지 최적화**
   - 1920x1080 이상 권장
   - 밝고 선명한 이미지 사용
   - 제품이 중앙에 위치

2. **상품명 작성**
   - 구체적으로 작성 (예: "2024 벤츠 E클래스" > "자동차")
   - 브랜드명 포함
   - 특징 포함 가능

3. **스타일 선택**
   - `dynamic`: 활기찬 영상 (일반 상품)
   - `professional`: 전문적인 영상 (B2B)
   - `luxury`: 고급스러운 영상 (프리미엄 제품)

## 📞 지원

문제가 있으시면 [Issues](https://github.com/garimto81/ai-shorts-maker/issues)에 등록해주세요.