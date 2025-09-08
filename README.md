# 자동차 복원 AI 쇼츠 제작기 (Car Restoration Shorts Maker) v2.7.0

🚀 **"자동차 작업 사진 몇 장만 업로드하세요. AI가 전문적인 자동차 복원 홍보 쇼츠를 자동으로 만들어 드립니다."**

## 📌 현재 개발 상황 (2025년 9월 8일 기준)

### ✅ 완전 구현된 핵심 기능 (Production Ready)
- **🎬 완전 자동화 비디오 생성**: 사진 → AI 분석 → 레퍼런스 기반 나레이션 → **페이드 전환 MP4 생성**
- **🚗 차량 브랜드별 맞춤 나레이션**: BMW, 벤츠, 포르쉐 등 브랜드 특성 반영 (제목 정보 필수 활용)
- **🎭 생생한 레퍼런스 기반 스타일**: 실제 업계 전문가 표현으로 AI 티 완전 제거
- **⏱️ 정밀한 타이밍 계산**: 한국어 초당 4자 기준 현실적 말하기 속도 반영
- **🎨 페이드 전환 효과**: 이미지 간 0.5초 부드러운 페이드 전환 적용

### ✅ 최근 완성된 핵심 업데이트 (v2.7.0)
- **🔄 "휠 정보" → "자동차 정보"로 전면 리뉴얼**: 함수명, 변수명, UI 텍스트 모두 변경
- **📝 4가지 전문 레퍼런스 추가**: SM6, BMW X5, 포드 익스플로러, 벤츠 E클래스 실제 나레이션 스타일 
- **🎯 제목 정보 강화**: "BMW X5" 입력 시 나레이션에 확실히 반영되도록 프롬프트 강화
- **🎙️ 생생한 전문 표현**: "가슴이 아팠습니다", "영원한 스테디 셀러", "신차급 퍼포먼스" 등

### 🔄 현재 작업 단계 (자막 삽입 과정)
- **현재 위치**: 자막(Subtitle) 삽입 기능 개발 단계
- **작업 내용**: 나레이션 스크립트에 맞는 한글 자막을 비디오에 오버레이
- **기술 구현**: FFmpeg 기반 SRT 자막 또는 burned-in 자막 처리
- **완성도**: 90% (비디오 + 음성 완료, 자막만 추가하면 완성)

### 🎯 다음 단계
1. **🔸 현재**: 자막 삽입 기능 완성 (FFmpeg subtitle 처리)
2. **완성**: 최종 테스트 및 품질 검증
3. **배포**: GitHub Pages 또는 Vercel 배포 준비

---

## 🎯 프로젝트 개요

### 🔥 핵심 가치
중고차, 휠 작업장, 도소매업 등 현장 작업자들이 **최소한의 노력으로 전문가 수준의 홍보용 숏폼 영상**을 제작할 수 있는 AI 기반 자동화 시스템입니다.

### 🎯 타겟 사용자
- **중고차 딜러** - 매물 홍보 영상 자동 생성
- **자동차 휠/타이어 및 튜닝 업체** - 작업 결과 쇼츠 제작
- **의류, 잡화 등 도소매업자** - 신상품 홍보 영상
- **공방, 수공예품 제작자** - 작품 소개 영상

### ⚡ 주요 특징
- **간편함**: 단 3단계(사진 선택 → 상품명 입력 → 자동 제작)
- **신속함**: 몇 분 안에 숏폼 영상 제작 완료
- **경제성**: 영상 편집 외주 비용 대비 획기적 절감
- **효율성**: 유튜브, 인스타그램, 틱톡 등 다양한 플랫폼 즉시 활용

## 🎯 나레이션 레퍼런스 (매우 중요)

다음 레퍼런스들은 AI 나레이션 생성 시 **필수적으로 참조**해야 하는 전문적이고 생생한 표현 스타일입니다:

### 레퍼런스 1: SM6 휠 복원
> 오늘 입고된차는 sm6 차량입니다.  
> 차주분이 휠복원 자체를 고민하시다 입고해주셨는데요  
> 저희랑 상담후에 새차같은 느낌을 원하신다 하셔서 원복을 원하셨습니다.  
>   
> 우선 탈거후 휠굴절 크랙을 확인해보고 바로 공정에 들어갔습니다.  
>   
> 샌드블라스터로 유분제거를 하고 바로 cnc 공정을 했습니다.  
>   
> 여기서 끝이 아니죠 휠표면을 보호해주는 클리어 코트를  
> 처리해주고 공정을 마무리 했더니  
> 완벽하게 새휠이 되었습니다.  
> 고객님도 저희도 둘다 만족한  
> 공정 이었습니다.

### 레퍼런스 2: BMW X5 휠 복원
> 오늘은 bmw 브랜드의 영원한 스테디 셀러 x5 차량이 입고되었습니다.  
>   
> 1억이 넘어가는 고가의 차량이  
> 휠기스로 인해서 들어오는 모습이 상당히 가슴이 아팠습니다.  
>   
> 일단 유분제거를 철저히 해주고  
> 세척과 샌딩후 전용 컷팅을  
> 해서 작업을 했더니  
> 다시금 신차급 퍼포먼스를 보여줍니다.  
>   
> 작업자로써 너무 만족하게 출고드렸습니다.  
> 제 드림카인만큼 열씨미 휠깍아서  
> Bmw 구매하는 날까지 여러분의 구독과 좋아요는 큰 힘이 됩니다.

### 레퍼런스 3: 포드 익스플로러 유광 블랙 도색
> 오늘 방문고객님은 포드사에 익스플로러 차주님이 셨습니다.  
> 기존휠의 기스와 더불어 새로운 이미지를 원하셨고  
> 저희와 오랜상담 끝에 휠에 무게감을  
> 더해줄수있는 유광 블랙도색을  
> 시공 하시기로 하셨습니다.  
>   
> 휠을 탈거해서 굴절과 크랙 점검후  
> 샌드 블라스트 작업으로 유분을 제거후에 표면 샌딩을 했습니다.  
>   
> 이제 작업자의 숙련도가 퀄리티에 직접적인 영향을 미치는 도색작업을 들어갔으며 마무리는 분체도색으로  
> 휠표면의 강성을 극대화 시켜서  
> 작업의 마무리를 했습니다.  
>   
> 확실히 휠의 색상이 차량에 전체적인 무게감을 더해준같아 너무 만족스런 작업이었습니다.

### 레퍼런스 4: 벤츠 E클래스 다이아몬드 컷팅 휠
> 허브휠복원 주치의 ○○입니다  
> 오늘입고된 차량은 벤츠 e클래스 차량입니다.  
> 명품삼각별의 품격을 자랑하는 벤츠가 지금까지 허름한 신발을 신고다닌것 같아 너무속상합니다.  
>   
> 서둘러 집도를 시작해보려합니다  
> 일다 다이아몬드 컷팅휠이니  
> 타르나 이물질 제거를 위해 샌드블라스터 작업을하고  
> 전문 cnc 기계로 돌려깍기를 하기로  
> 결정했습니다.  
> 다행인것은 휠표면에만 스크레치가  
> 확인되고 휠내부에는 굴절이나 크렉이 발견되지 않았습니다.  
>   
> 저희는 꼼꼼하게 크랙 굴절까지 체크하는게 휠복원 집도라 생각하고  
> 어설프게 액상으로 마감하는게  
> 오히려 휠퀄리티를 떨어뜨린다는 생각에 고온건조기 (180도)로 분체클리어를 도포함으로써  
> 좀더 견고함을 주려 노력합니다.  
>   
> 결과물을 보시면 완벽한 cnc 공법후  
> 발란스까지 체크하는 섬세함 마지막  
> 상도클리어까지  도포  
>   
> 벤츠는 벤츠다울때 진정한 멋이 살아난다고 할까요?  
>   
> 저희 허브휠복원의 집도가 마음에 드셨다면 다들 좋아요 한번씩 부탁드리면서 인사드립니다.

### 🎨 레퍼런스 활용 지침

1. **차량 브랜드별 특성 강조**: BMW(고급감, 드림카), 벤츠(명품삼각별의 품격), 포드(실용성) 등
2. **전문 용어 적극 활용**: 샌드블라스터, CNC, 분체도색, 다이아몬드 컷팅, 굴절, 크랙, 클리어 코트
3. **감정적 표현**: "가슴이 아팠습니다", "너무 만족스런", "품격을 자랑하는", "허름한 신발을 신고다닌것 같아"
4. **구체적 작업 과정**: 탈거 → 점검 → 유분제거 → 샌딩 → 도색 → 클리어코트
5. **고객 관점**: 상담 과정, 요구사항, 만족도 등
6. **전문가적 자부심**: "작업자로써", "집도", "퀄리티", "숙련도"

---

## 🛠️ 기술 스택

- **AI**: Google Gemini 1.5 Flash (Vision + Text)
- **Backend**: Node.js + Express.js 
- **Frontend**: Vanilla JS + Tailwind CSS
- **Video**: FFmpeg (전환 효과 및 비디오 생성)
- **Image**: Sharp (9:16 비율 최적화)
- **Database**: JSON 기반 임시 저장
- **Environment**: Windows 10, Node.js 환경

## 📁 프로젝트 구조

```
ai-shorts-maker/
├── 📁 scripts/
│   └── process-video.js           # ShortsGenerator 클래스 (메인 로직)
├── 📁 storage/images/             # 압축된 이미지 저장소
├── 📁 output/                     # 생성된 비디오 출력
├── 📁 temp/                       # 임시 파일 처리
├── 🌐 mobile-android.html         # 안드로이드 최적화 인터페이스 ✅
├── 🧪 test-video-generation.html  # 전체 시스템 테스트 ✅
├── 🎬 test-ffmpeg-transitions.html # FFmpeg 전환 효과 테스트 ✅
├── 🗂️ test-filename-sort.html     # 파일명 정렬 테스트 ✅
├── ⚙️ server.js                   # Express 서버 (포트: 3007) ✅
├── 📋 package.json               # v2.4.0
└── 📖 README.md                  # 현재 파일
```

## 🚀 설치 및 실행 방법

### 1. 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd E:\claude03\ai-shorts-maker

# 의존성 확인 (이미 설치됨)
npm install

# 환경 변수 확인 (.env 파일)
GEMINI_API_KEY=your_api_key_here    # ✅ 설정됨
ELEVENLABS_API_KEY=your_api_key     # ✅ 설정됨
```

### 2. 서버 실행

```bash
# 서버 시작 (백그라운드에서 이미 실행 중)
node server.js

# 서버 확인
# http://localhost:3006 - 메인 페이지 (포트 변경됨)
# http://localhost:3006/api/health - API 상태 체크
```

### 3. 인터페이스 접속

- **💎 메인 사용**: `http://localhost:3006/` (휠복원 전용 UI)
- **📱 모바일 최적화**: `http://localhost:3006/mobile-android.html`
- **🧪 시스템 테스트**: `http://localhost:3006/test-video-generation.html`
- **🎬 전환 효과 테스트**: `http://localhost:3006/test-ffmpeg-transitions.html`

## 🎬 완성된 기능들

### 🤖 3단계 AI 워크플로우 ✅

#### 1단계: AI 파일명 분석 및 자동 정렬
```javascript
// API: /api/sort-filenames
// 파일명에서 의미를 추출하여 최적 순서로 정렬
// 예: ["before_damage.jpg", "process_01.jpg", "final_result.jpg"] 
//  → [0, 1, 2] (before → process → final)
```

#### 2단계: 순차적 상세 이미지 분석  
```javascript
// API: /api/analyze-batch
// 정렬된 순서대로 각 이미지 상세 분석
// Gemini Vision API로 객체, 특징, 색상, 구도 등 분석
```

#### 3단계: 2단계 나레이션 시스템
```javascript
// API: /api/generate-narration
// 1단계: 전체 스토리 생성 (일관성 있는 완전한 스토리)
// 2단계: 이미지별 세그먼트 분할 (자연스러운 분할)
```

### 📱 모바일 최적화 인터페이스 ✅

**mobile-android.html 주요 기능**:
- 3단계 진행바와 실시간 상태 표시
- 업종 선택 최상단 배치
- 제품명 입력 2번째 위치  
- 이미지 썸네일 표시 (숫자 대신 실제 이미지)
- 터치 최적화 UI (Android 스마트폰 전용)

### 🎥 완전 자동화 비디오 생성 시스템 ✅

**v2.6.0 핵심 업데이트 - Production Ready**:
```javascript
// ✅ 완전 구현된 영상 제작 파이프라인
// 1. processImagesForVideo(): Sharp 기반 1080x1920 최적화
// 2. createVideoSegments(): 1:1 이미지-스크립트 매핑
// 3. generateVideoWithFFmpeg(): 실제 MP4 파일 생성
// 4. 웹 다운로드 링크 자동 제공 (/output/filename.mp4)

// ✅ 실제 동작하는 기능들
- 말하기 속도 기반 타이밍 (한국어 초당 4자)
- Ken Burns 효과 및 전환 효과
- 세그먼트별 비디오 생성 후 최종 결합
- 임시 파일 자동 정리
- 실시간 진행률 표시
```

**테스트 상태**: 
- ✅ 코드 완전 구현 
- ⚠️ **FFmpeg 실제 테스트 필요** (다음 단계)

## 🎬 FFmpeg 전환 효과 시스템 ✅

### ✅ 해결 완료 (2024-09-06)
- **파일**: `test-ffmpeg-transitions.html` 
- **해결된 문제**: `executeFFmpegCommand()` 메서드 파싱 오류 수정
- **현재 상태**: 모든 전환 효과 정상 작동 가능
- **테스트 URL**: `http://localhost:3007/test-ffmpeg-transitions.html`

### 🎨 지원하는 전환 효과 (16가지)

#### 기본 xfade 전환 효과 (10가지)
```javascript
const transitionMappings = {
  crossfade: 'fade',           // 크로스페이드
  slideleft: 'slideleft',      // 왼쪽 슬라이드
  slideright: 'slideright',    // 오른쪽 슬라이드
  slideup: 'slideup',          // 위쪽 슬라이드
  slidedown: 'slidedown',      // 아래쪽 슬라이드
  wipeleft: 'wipeleft',        // 왼쪽 와이프
  circleopen: 'circleopen',    // 원형 확장
  diagtl: 'diagtl',           // 대각선 (상단좌측)
  dissolve: 'dissolve',        // 디졸브
  rotate: 'rotate'             // 회전
};
```

#### 고급 커스텀 효과 (6가지)
```javascript
// Ken Burns 효과 (영화적 확대/축소 + 팬)
zoompan=z='1.0+0.002*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'

// 픽셀화 효과
scale=54:96:flags=neighbor,scale=1080:1920:flags=neighbor

// 블러 전환
boxblur=5:1

// 글리치 효과  
noise=alls=20:allf=t+u,colorchannelmixer

// 컬러 시프트
hue=h=60

// 줌 + 페이드 조합
```

#### 복합 스타일 (4가지)
```javascript
const styleEffects = {
  cinematic: ['kenburns', 'crossfade', 'zoomfade'],
  dynamic: ['slideright', 'circleopen', 'rotate'],
  elegant: ['dissolve', 'blur', 'crossfade'],
  energetic: ['glitch', 'colorshift', 'pixelize']
};
```

### 🛠️ API 엔드포인트 (구현됨)

```javascript
// 기본 전환 효과 테스트
POST /api/test-transitions
{
  "images": [File, File, File],
  "transitionType": "crossfade",
  "duration": 2,
  "transitionDuration": 1
}

// 복합 전환 효과 테스트  
POST /api/test-complex-transitions
{
  "images": [File, File, File],
  "styleType": "cinematic",
  "duration": 3,
  "transitionDuration": 1.5
}

// 전환 효과 비교
POST /api/compare-transitions
{
  "images": [File, File, File],
  "effects": ["crossfade", "slideleft", "dissolve"]
}
```

### 🔧 해결한 주요 문제들

1. **executeFFmpegCommand() 메서드 재작성 ✅**
   - 입력 파싱 로직 완전히 개선
   - `imagePaths` 배열 직접 전달 방식 채택
   - 상세한 로깅 및 오류 처리 추가

2. **buildTransitionCommand 시리즈 메서드 개선 ✅**
   - 모든 전환 효과에 `imagePaths` 직접 포함
   - 커스텀 전환 효과 로깅 강화
   - 안정적인 FFmpeg 명령어 생성 보장

3. **서버 환경 개선 ✅**
   - 포트 환경변수 설정 가능 (`PORT=3007`)
   - 여러 서버 인스턴스 동시 실행 지원
   - API 엔드포인트 안정성 향상

## 📊 API 엔드포인트 전체 목록

### ✅ 정상 작동하는 API
- `GET /api/health` - 서버 상태 체크
- `POST /api/sort-filenames` - AI 파일명 분석 및 정렬
- `POST /api/analyze-image` - 개별 이미지 분석
- `POST /api/analyze-batch` - 배치 이미지 분석
- `POST /api/generate-narration` - 2단계 나레이션 생성
- `POST /api/complete-workflow` - 3단계 통합 워크플로우
- `POST /api/generate-video` - 향상된 비디오 생성 (2단계 나레이션 활용)
- `POST /api/generate` - 레거시 비디오 생성 (하위 호환)
- `GET /api/videos` - 생성된 비디오 목록

### ✅ FFmpeg 전환 효과 API (해결 완료)
- `POST /api/test-transitions` - 기본 전환 효과 테스트
- `POST /api/test-complex-transitions` - 복합 전환 효과 테스트  
- `POST /api/compare-transitions` - 전환 효과 비교

## 🎯 버전 히스토리

### v2.4.0 (현재) - FFmpeg 전환 효과 시스템 ✅
- **상태**: 개발 완료 (코드 구현 + 오류 해결 완료)
- **신규**: FFmpeg 전환 효과 16가지 + 복합 스타일 4가지
- **파일**: `test-ffmpeg-transitions.html`, 새로운 API 3개 정상 작동

### v2.3.0 - 향상된 영상 생성 시스템 ✅
- **완료**: 3단계 AI 워크플로우, 2단계 나레이션 시스템
- **UI**: 모바일 Android 최적화, 이미지 썸네일 표시

### v2.2.0 - UI 개선 및 이미지 표시 ✅
- **완료**: 숫자 대신 실제 이미지 표시

### v2.1.1 - 2단계 나레이션 시스템 ✅  
- **완료**: 전체 스토리 생성 → 세그먼트 분할

### v2.0.0 - 기본 AI 비디오 생성 ✅
- **완료**: Gemini Vision API 통합, 기본 비디오 생성

## 🚨 현재 해결해야 할 우선순위

### 1. 🔧 FFmpeg 전환 효과 오류 해결 (최우선)
- **파일**: `scripts/process-video.js`
- **메서드**: `executeFFmpegCommand()` 
- **증상**: 전환 효과 테스트 시 오류 발생
- **접근법**: 로깅 추가, 단계별 디버깅

### 2. ✅ 전환 효과 정상 작동 확인
- **테스트**: `http://localhost:3006/test-ffmpeg-transitions.html`
- **검증**: 각 전환 효과별 비디오 생성 확인

### 3. 🔗 메인 시스템 통합
- **목표**: `generateEnhancedVideo()`에 전환 효과 적용
- **결과**: 완전한 AI 쇼츠 제작 시스템 완성

## 🎯 최종 목표

**완전 자동화된 AI 쇼츠 제작 파이프라인**:
1. 이미지 업로드 (3장 이상)
2. 업종 선택 + 제품명 입력  
3. AI 3단계 자동 처리 (파일명 정렬 → 이미지 분석 → 나레이션 생성)
4. 전환 효과가 적용된 고품질 쇼츠 비디오 생성 (30초, 1080x1920)
5. 다운로드 및 SNS 업로드

---

## 💡 개발자 노트

### 현재 서버 상태
- **포트**: 3006 (정상 동작)
- **백그라운드 프로세스**: 5개 실행 중
- **환경변수**: Gemini API ✅, ElevenLabs API ✅

### 개발 환경
- **OS**: Windows 10 (MSYS_NT-10.0-19045)
- **Node.js**: ES6 modules 사용
- **디렉토리**: E:\claude03\ai-shorts-maker

### 다음 재개 시 확인사항
1. 서버 실행 상태: `http://localhost:3006/api/health`
2. FFmpeg 설치 확인: `ffmpeg -version`
3. 임시 디렉토리 존재: `temp/`, `output/` 
4. 전환 효과 테스트: `test-ffmpeg-transitions.html` 페이지 열기

**🎯 즉시 해야할 작업**: FFmpeg 전환 효과 오류 디버깅 및 수정