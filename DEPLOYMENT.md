# 🚀 AI Shorts Maker 배포 가이드

## 📋 개요

AI Shorts Maker를 온라인 웹앱으로 배포하는 단계별 가이드입니다.

## 🎯 Vercel 원클릭 배포 (권장)

### 1. GitHub 저장소 생성

1. **GitHub 계정 준비**
   - GitHub 계정 로그인
   - 새 저장소 생성: `ai-shorts-maker`

2. **로컬 프로젝트를 GitHub에 푸시**
```bash
cd ai-shorts
git init
git add .
git commit -m "Initial commit: AI Shorts Maker v1.6.2"
git branch -M main
git remote add origin https://github.com/garimto81/ai-shorts-maker.git
git push -u origin main
```

### 2. Vercel 원클릭 배포

1. **배포 버튼 클릭**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/garimto81/ai-shorts-maker)

2. **Vercel 계정 연동**
   - GitHub 계정으로 Vercel 로그인
   - 저장소 선택: `ai-shorts-maker`
   - 프로젝트 이름 확인

3. **환경 변수 설정**
   ```env
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your_random_secret_string
   ```

4. **배포 시작**
   - "Deploy" 버튼 클릭
   - 3-5분 대기
   - 배포 완료!

## 🔧 수동 Vercel 배포

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. 프로젝트 배포
```bash
# 로그인
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 환경 변수 설정
```bash
# Vercel 대시보드에서 설정하거나 CLI 사용
vercel env add GOOGLE_AI_API_KEY
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

## 🔑 필수 환경 변수

### Gemini AI API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. API 키 복사
4. Vercel 환경 변수에 `GOOGLE_AI_API_KEY` 추가

### 기타 환경 변수
```env
# 필수
GOOGLE_AI_API_KEY=your_gemini_api_key_here
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate_random_string_here

# 선택사항
MAX_FILE_SIZE=10485760
MAX_FILES_COUNT=20
VIDEO_TEMP_DIR=/tmp/video-render
```

## 🎭 GitHub Actions 자동 배포

### 1. GitHub Secrets 설정

저장소 → Settings → Secrets and variables → Actions에서 추가:

```
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_vercel_org_id
PROJECT_ID=your_vercel_project_id
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### 2. Vercel 토큰 발급
1. [Vercel 계정 설정](https://vercel.com/account/tokens) 접속
2. "Create Token" 클릭
3. 토큰 이름 입력 후 생성
4. GitHub Secrets에 `VERCEL_TOKEN` 추가

### 3. 조직 ID와 프로젝트 ID 확인
```bash
# Vercel CLI로 확인
vercel link
cat .vercel/project.json
```

### 4. 자동 배포 테스트
```bash
git add .
git commit -m "Test auto deployment"
git push origin main
```

## 🌐 도메인 설정

### 1. 커스텀 도메인 연결

1. **Vercel 대시보드**
   - 프로젝트 → Settings → Domains
   - 도메인 입력: `your-domain.com`
   - DNS 설정 확인

2. **DNS 설정**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 2. SSL 인증서
- Vercel에서 자동으로 Let's Encrypt SSL 인증서 발급
- HTTPS 자동 활성화

## 🔍 배포 후 확인사항

### 1. 기능 테스트
- [ ] 메인 페이지 로딩
- [ ] 이미지 업로드 기능
- [ ] AI 파일 정렬 기능
- [ ] TTS 음성 생성
- [ ] 비디오 렌더링 (클라우드 모드)
- [ ] 파일 다운로드

### 2. 성능 체크
```bash
# Lighthouse 점수 확인
npm install -g lighthouse
lighthouse https://your-app.vercel.app --view
```

### 3. 에러 모니터링
- Vercel 대시보드 → Functions → Logs
- 실시간 에러 로그 확인

## 🚨 문제 해결

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npm run type-check

# 린트 에러 확인
npm run lint
```

### 환경 변수 문제
```bash
# Vercel 환경 변수 확인
vercel env ls

# 특정 환경 변수 확인
vercel env pull .env.local
```

### 메모리 제한
- Vercel Pro 플랜 고려 (Hobby: 1GB → Pro: 3GB)
- 이미지 크기 최적화
- 동시 처리 제한

### API 타임아웃
```javascript
// vercel.json에서 함수 타임아웃 설정
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

## 📊 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP, AVIF 형식 자동 변환
- 반응형 이미지 크기

### 2. 번들 크기 최적화
```bash
# 번들 분석
npm run build:analyze

# 불필요한 패키지 제거
npm uninstall unused-package
```

### 3. 캐싱 전략
- Static 파일: 1년 캐싱
- API 응답: 적절한 Cache-Control 헤더
- 이미지: CDN 자동 캐싱

## 🔄 업데이트 배포

### 자동 배포 (GitHub Actions)
```bash
git add .
git commit -m "Update: new features"
git push origin main
# 자동으로 배포됨
```

### 수동 배포
```bash
vercel --prod
```

## 📞 지원

- 📖 **Vercel 문서**: https://vercel.com/docs
- 🆘 **GitHub Issues**: https://github.com/yourusername/ai-shorts-maker/issues
- 💬 **Vercel Discord**: https://vercel.com/discord
- 📧 **이메일 지원**: support@yourapp.com

---

**배포 완료 후 라이브 URL을 README.md에 업데이트하세요!** 🚀