# 🌐 AI Shorts Maker 온라인 환경 설정 가이드

## 📋 필요한 준비사항

1. **GitHub 계정**
2. **Vercel 계정** (GitHub 로그인 가능)
3. **API 키들**:
   - Google AI (Gemini) API 키
   - ElevenLabs API 키 (선택사항)

## 🚀 빠른 시작 (5분)

### 1. GitHub Fork
1. https://github.com/garimto81/ai-shorts-maker 접속
2. 우측 상단 **Fork** 버튼 클릭
3. 본인 계정에 저장소 생성

### 2. Vercel 배포
1. https://vercel.com 접속
2. **New Project** 클릭
3. GitHub 저장소 연결 (ai-shorts-maker 선택)
4. **Deploy** 클릭

### 3. 환경 변수 설정
Vercel 대시보드에서:
1. **Settings** → **Environment Variables**
2. 다음 변수 추가:
   ```
   GOOGLE_AI_API_KEY=your_google_ai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   VERCEL_TOKEN=your_vercel_token
   ```

### 4. GitHub Secrets 설정
GitHub 저장소에서:
1. **Settings** → **Secrets and variables** → **Actions**
2. 다음 시크릿 추가:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   GOOGLE_AI_API_KEY=your_google_ai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

## 🔗 온라인 테스트 링크

배포 완료 후:
- **메인 앱**: `https://your-project.vercel.app`
- **데모 페이지**: `https://your-project.vercel.app/demo`
- **TTS 테스트**: `https://your-project.vercel.app/tts-demo`

## 📱 비디오 생성 방법

### GitHub Issue로 생성
1. **Issues** → **New Issue**
2. **비디오 생성 요청** 템플릿 선택
3. 제목과 이미지 URL 입력
4. 자동으로 비디오 생성 시작

### 온라인 앱에서 생성
1. 배포된 사이트 접속
2. 이미지 업로드 또는 URL 입력
3. 제목 입력
4. **생성** 버튼 클릭

## 🔧 고급 설정

### Vercel 프로젝트 ID 찾기
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# .vercel/project.json 파일에서 확인
cat .vercel/project.json
```

### API 키 발급 방법

**Google AI API**:
1. https://makersuite.google.com/app/apikey
2. **Create API Key** 클릭
3. 키 복사

**ElevenLabs API**:
1. https://elevenlabs.io
2. 계정 생성 후 Profile 클릭
3. API Key 복사

## 🚨 문제 해결

### 배포 실패
- 환경 변수 확인
- Node.js 버전 확인 (18.x 필요)
- 빌드 로그 확인

### 비디오 생성 실패
- API 키 유효성 확인
- 이미지 URL 접근 가능 여부 확인
- GitHub Actions 로그 확인

## 📞 지원

문제가 있으시면:
- GitHub Issues: https://github.com/garimto81/ai-shorts-maker/issues
- 디스코드: [커뮤니티 링크]