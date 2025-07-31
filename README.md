# AI Shorts Maker 🎬

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://garimto81.github.io/ai-shorts-maker/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

간단한 파일 정렬 시스템 - 브라우저에서 실행되는 정적 웹 애플리케이션 (v2.0.1)

## ✨ 주요 기능

### 🖼️ 간단한 이미지 정렬 시스템
- **📊 파일명 기준 정렬**: 오름차순(A→Z) 및 내림차순(Z→A) 지원
- **🔀 직접 순서 제어**: 드래그 앤 드롭으로 이미지 순서를 자유롭게 변경
- **🎯 직관적인 UI**: 사용자가 원하는 순서대로 이미지 배치 가능
- **📱 실시간 미리보기**: 정렬된 순서를 즉시 확인 가능

### 🎙️ Gemini AI TTS
- **자연스러운 음성**: Google Gemini AI 기반 고품질 음성 생성
- **다양한 설정**: 음성 속도, 스타일, 언어 선택
- **실시간 미리보기**: 생성된 음성 즉시 재생 및 다운로드

### 🎥 고품질 비디오 렌더링
- **환경별 최적화**: 로컬(FFmpeg Native) / 클라우드(WebAssembly) 자동 선택
- **자동 자막**: 스크립트 기반 자막 자동 생성 및 삽입
- **다양한 설정**: 해상도, 품질, 프레임레이트, 출력 형식 선택
- **실시간 진행률**: 렌더링 과정 실시간 모니터링

### 📝 스마트 스크립트 관리
- **AI 자동 생성**: 본문만 입력하면 제목, 설명, 태그 자동 생성
- **영상화 스크립트**: 등록된 스크립트를 영상용으로 자동 변환
- **메타데이터 관리**: 카테고리, 난이도, 예상 시간 자동 분석

## 🚀 온라인 데모

**Live Demo**: [https://garimto81.github.io/ai-shorts-maker/](https://garimto81.github.io/ai-shorts-maker/)

### 빠른 테스트 방법
1. 이미지 파일들을 업로드
2. 파일명 기준 오름차순/내림차순 정렬 선택
3. 또는 "직접 드래그하여 순서 변경" 선택해서 수동 정렬
4. 프로젝트 제목 입력
5. "AI 영상 제작" 클릭
6. 완성된 MP4 비디오 다운로드

## 🛠️ 기술 스택

### Frontend
- **Next.js 14**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성과 개발 효율성
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **Radix UI**: 접근성 우선 컴포넌트 라이브러리

### Backend & AI
- **Google Gemini AI**: 텍스트 생성, TTS (음성 합성)
- **FFmpeg**: 고품질 비디오 렌더링 (로컬 환경)
- **WebAssembly**: 클라우드 환경 비디오 처리
- **Formidable**: 멀티파트 파일 업로드
- **간단한 정렬**: 파일명 기반 오름차순/내림차순 및 수동 정렬

### Deployment
- **Vercel**: 서버리스 배포 플랫폼
- **GitHub Actions**: 자동 CI/CD 파이프라인
- **Environment Variables**: 보안 API 키 관리

## 📦 로컬 설치 및 실행

### 필요 조건
- Node.js 18+ 
- npm 또는 yarn
- Google AI API 키
- FFmpeg (로컬 렌더링용, 선택사항)

### 설치 과정

1. **저장소 클론**
```bash
git clone https://github.com/garimto81/ai-shorts-maker.git
cd ai-shorts-maker
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env.local
```

`.env.local` 파일에 다음 내용 추가:
```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
# 텍스트 생성 및 TTS(음성 합성) 기능에 사용
```

4. **개발 서버 실행**
```bash
npm run dev
```

5. **브라우저에서 확인**
```
http://localhost:3000
```

## ☁️ Vercel 배포

### 원클릭 배포
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/garimto81/ai-shorts-maker)

### 수동 배포

1. **Vercel CLI 설치**
```bash
npm i -g vercel
```

2. **프로젝트 배포**
```bash
vercel
```

3. **환경 변수 설정**
Vercel 대시보드에서 다음 환경 변수 추가:
- `GOOGLE_AI_API_KEY`: Gemini AI API 키
- `NEXTAUTH_URL`: 배포된 도메인 URL
- `NEXTAUTH_SECRET`: 인증용 시크릿 키

## 🌍 GitHub Actions 자동 배포

`.github/workflows/deploy.yml` 파일이 포함되어 있어 GitHub에 푸시하면 자동으로 Vercel에 배포됩니다.

### 필요한 GitHub Secrets
- `VERCEL_TOKEN`: Vercel 액세스 토큰
- `ORG_ID`: Vercel 조직 ID
- `PROJECT_ID`: Vercel 프로젝트 ID
- `GOOGLE_AI_API_KEY`: Gemini AI API 키

## 📁 프로젝트 구조

```
ai-shorts-maker/
├── components/           # React 컴포넌트
│   ├── simple-file-sorter-ui.tsx
│   ├── video-renderer-ui.tsx
│   ├── script-management-ui.tsx
│   └── ui/              # 재사용 가능한 UI 컴포넌트
├── lib/                 # 핵심 라이브러리
│   ├── gemini-client.ts
│   ├── simple-file-sorter.ts           # 간단한 파일명 기반 정렬
│   ├── gemini-tts.ts                   # TTS 음성 생성
│   ├── ffmpeg-video-renderer-server.ts
│   ├── ffmpeg-cloud-renderer.ts
│   └── video-script-generator.ts
├── pages/
│   ├── api/             # API 라우트
│   │   ├── upload-temp-images.ts
│   │   ├── videos/render.ts
│   │   └── tts/generate.ts
│   ├── index.tsx        # 메인 페이지
│   └── scripts.tsx      # 스크립트 관리
├── public/              # 정적 파일
├── styles/              # 글로벌 스타일
└── .github/workflows/   # GitHub Actions
```

## 🔧 API 엔드포인트

### 이미지 업로드
```
POST /api/upload-temp-images
Content-Type: multipart/form-data
```

### 비디오 렌더링
```
POST /api/videos/render
Content-Type: application/json
```

### TTS 음성 생성
```
POST /api/tts/generate
Content-Type: application/json
```

### 스크립트 자동 생성
```
POST /api/scripts/auto-generate
Content-Type: application/json
```

## 🎯 사용 사례

### 1. 여행 영상 제작
- 여행 사진들을 업로드
- AI가 시간순으로 자동 정렬
- 여행 일정에 맞는 스크립트 작성
- TTS로 나레이션 추가
- 완성된 여행 영상 생성

### 2. 제품 소개 영상
- 제품 사진들을 업로드
- 제품 특징별로 정렬
- 마케팅 스크립트 작성
- 전문적인 음성 나레이션
- 브랜딩 영상 완성

### 3. 교육 콘텐츠
- 교육 자료 이미지 업로드
- 학습 순서에 맞게 정렬
- 교육용 스크립트 작성
- 명확한 음성 설명
- 온라인 강의 영상 제작

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📋 버전 히스토리

### 🚀 v2.0.0 (2025-01-31) - 단순화된 이미지 정렬 시스템
- **✨ 개선**: AI 정렬 시스템 제거로 더 빠르고 간단한 사용성
- **✨ 신규**: 파일명 기반 오름차순/내림차순 정렬
- **✨ 신규**: 드래그 앤 드롭으로 직접 순서 제어
- **🔧 개선**: 사용자가 직접 순서를 결정할 수 있는 유연성
- **🛡️ 제거**: 불필요한 AI 분석 복잡도 제거

### v1.6.2 (2025-01-28) - 브라우저 기반 비디오 렌더링
- **✨ 신규**: 브라우저 기반 실시간 비디오 렌더링
- **🔧 개선**: 듀얼 렌더 모드 (로컬/클라우드)
- **🔧 개선**: Vercel 배포 최적화

## 🙏 감사의 말

- [Google Gemini AI](https://ai.google.dev/) - 텍스트 생성 및 TTS 기능 제공
- [Next.js](https://nextjs.org/) - 풀스택 프레임워크
- [Vercel](https://vercel.com/) - 배포 플랫폼
- [FFmpeg](https://ffmpeg.org/) - 비디오 처리
- [Tailwind CSS](https://tailwindcss.com/) - 스타일링
- [Radix UI](https://www.radix-ui.com/) - 컴포넌트 라이브러리

## 🆘 지원 및 문의

- 📧 이메일: support@yourapp.com
- 🐛 버그 리포트: [GitHub Issues](https://github.com/garimto81/ai-shorts-maker/issues)
- 💬 토론: [GitHub Discussions](https://github.com/garimto81/ai-shorts-maker/discussions)
- 📖 문서: [위키](https://github.com/garimto81/ai-shorts-maker/wiki)

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!