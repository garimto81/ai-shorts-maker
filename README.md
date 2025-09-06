# AI 쇼츠 제작 공장 2.0

🚀 **Gemini AI를 활용한 혁신적인 쇼츠 자동 생성 시스템**

## 🎯 프로젝트 개요

이미지와 상품명만으로 AI가 자동으로 마케팅 쇼츠 영상을 생성하는 시스템입니다.
- Gemini Vision API로 이미지 분석
- AI 기반 스크립트 및 나레이션 생성
- GitHub Actions를 통한 서버리스 처리
- 1MB 이하 이미지 자동 압축 및 GitHub 저장

## 🛠️ 기술 스택

- **AI**: Google Gemini 1.5 Flash (Vision + Text)
- **Backend**: Node.js + GitHub Actions
- **Frontend**: Vanilla JS + Tailwind CSS
- **Storage**: GitHub Repository (이미지 저장)
- **Video**: FFmpeg (비디오 생성)
- **Image**: Sharp (이미지 압축)

## 📋 설치 방법

### 1. Repository 설정

```bash
# 리포지토리 클론
git clone https://github.com/garimto81/ai-shorts-maker.git
cd ai-shorts-maker

# 의존성 설치
npm install
```

### 2. GitHub Secrets 설정

GitHub 리포지토리 Settings → Secrets and variables → Actions에서 추가:

- `GEMINI_API_KEY`: Google AI Studio에서 발급
- `ELEVENLABS_API_KEY`: (선택) 음성 생성용

### 3. 로컬 개발 환경

```bash
# 환경 변수 설정 (.env 파일)
GEMINI_API_KEY=your_gemini_api_key_here

# 개발 서버 실행
npm run dev
```

## 🚀 사용 방법

### 방법 1: 웹 인터페이스

1. `index.html` 열기 또는 GitHub Pages 배포
2. 이미지 3장 이상 업로드
3. 상품명 입력
4. 스타일 및 업종 선택
5. "AI 쇼츠 생성하기" 클릭

### 방법 2: GitHub Actions (서버리스)

1. Actions 탭 → "Process Video with AI" 워크플로우
2. Run workflow 클릭
3. 파라미터 입력:
   - `images`: 이미지 URL (콤마 구분)
   - `product_name`: 상품명
   - `style`: dynamic/professional/luxury
4. 생성된 영상은 Artifacts에서 다운로드

### 방법 3: CLI 직접 실행

```bash
node scripts/process-video.js \
  --images="url1,url2,url3" \
  --product="상품명" \
  --style="dynamic"
```

## 📁 프로젝트 구조

```
ai-shorts-maker/
├── .github/
│   └── workflows/
│       └── process-video.yml    # GitHub Actions 워크플로우
├── scripts/
│   └── process-video.js         # 핵심 처리 엔진
├── storage/
│   └── images/                  # 압축된 이미지 저장 (1MB 이하)
├── output/                      # 생성된 비디오 출력
├── index.html                   # 웹 인터페이스
├── package.json                 # 프로젝트 설정
└── README.md                    # 문서
```

## 🎬 생성 프로세스

1. **이미지 처리**
   - 업로드된 이미지 다운로드
   - 1MB 초과시 자동 압축 (품질 유지)
   - GitHub storage/images/에 저장

2. **AI 분석 (Gemini Vision)**
   - 제품 특징 추출
   - 타겟 고객층 분석
   - 마케팅 포인트 도출

3. **스크립트 생성 (Gemini)**
   - 10초 구조화된 스크립트
   - 나레이션 텍스트
   - 화면 자막
   - 영상 연출 지시

4. **비디오 생성 (FFmpeg)**
   - Ken Burns 효과 (줌/팬)
   - 크로스페이드 전환
   - 1080x1920 세로형 포맷

## 🔧 고급 설정

### 이미지 압축 설정

```javascript
// scripts/process-video.js
const compressionOptions = {
  maxSize: 1024 * 1024,  // 1MB
  quality: 85,           // 초기 품질
  minQuality: 20,        // 최소 품질
  step: 10               // 품질 감소 단계
};
```

### 비디오 설정

```javascript
const videoConfig = {
  resolution: '1080x1920',
  fps: 30,
  duration: 10,  // seconds
  codec: 'libx264',
  preset: 'fast'
};
```

## 📊 API 사용량 관리

### Gemini API 비용 예상
- 이미지 분석: ~$0.002 per image
- 텍스트 생성: ~$0.001 per request
- 예상 비용: **쇼츠당 약 $0.01**

### 비용 최적화 팁
1. 이미지는 3-5장으로 제한
2. 생성된 분석 결과 캐싱
3. 배치 처리로 API 호출 최소화

## 🚨 트러블슈팅

### FFmpeg 설치 (로컬 환경)

```bash
# Windows
winget install ffmpeg

# Mac
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### GitHub Actions 실패시
1. Secrets 설정 확인
2. 이미지 URL 접근 가능 여부 확인
3. Actions 로그에서 상세 에러 확인

## 📈 로드맵

- [x] Gemini Vision 이미지 분석
- [x] AI 스크립트 생성
- [x] FFmpeg 비디오 생성
- [x] GitHub Actions 통합
- [ ] ElevenLabs 음성 생성
- [ ] 배경음악 자동 선택
- [ ] 실시간 트렌드 반영
- [ ] A/B 테스트 버전 생성
- [ ] 성과 예측 모델

## 📝 라이선스

MIT License

## 🤝 기여하기

Pull requests 환영합니다!

## 📧 문의

Issues 탭을 통해 문의해주세요.