# 자동 쇼츠 생성기 프로젝트

## 프로젝트 개요
이미지와 텍스트를 조합하여 자동으로 YouTube Shorts, Instagram Reels, TikTok 등에 사용할 수 있는 짧은 동영상을 생성하는 시스템

## 기술 스택
- **Python 3.9+**: 메인 개발 언어
- **OpenCV**: 이미지 처리
- **MoviePy**: 비디오 편집 및 생성
- **Pillow**: 이미지 조작 및 텍스트 렌더링
- **gTTS/edge-tts**: 텍스트 음성 변환
- **FastAPI**: API 서버 (선택사항)
- **FFmpeg**: 비디오 인코딩

## 프로젝트 구조
```
auto-shorts-generator/
├── docs/                    # 문서
│   ├── API.md              # API 문서
│   ├── USAGE.md            # 사용 가이드
│   └── ARCHITECTURE.md    # 아키텍처 설명
├── src/                    # 소스 코드
│   ├── core/              # 핵심 모듈
│   │   ├── __init__.py
│   │   ├── image_processor.py    # 이미지 처리
│   │   ├── text_processor.py     # 텍스트 처리
│   │   ├── video_generator.py    # 비디오 생성
│   │   ├── audio_processor.py    # 오디오 처리
│   │   └── effects.py           # 효과 및 트랜지션
│   ├── templates/         # 템플릿
│   │   ├── basic.py      # 기본 템플릿
│   │   ├── news.py       # 뉴스 스타일
│   │   ├── story.py      # 스토리 스타일
│   │   └── product.py    # 제품 소개
│   ├── utils/            # 유틸리티
│   │   ├── __init__.py
│   │   ├── config.py     # 설정 관리
│   │   ├── logger.py     # 로깅
│   │   └── validators.py # 입력 검증
│   ├── api/              # API (선택사항)
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI 앱
│   │   └── routes.py     # API 라우트
│   └── main.py           # 메인 실행 파일
├── assets/               # 리소스
│   ├── fonts/           # 폰트 파일
│   ├── music/           # 배경음악
│   ├── templates/       # 비디오 템플릿
│   └── watermarks/      # 워터마크
├── input/               # 입력 파일
│   ├── images/         # 입력 이미지
│   └── scripts/        # 스크립트 파일
├── output/             # 생성된 비디오
├── tests/              # 테스트
│   ├── test_image.py
│   ├── test_text.py
│   ├── test_video.py
│   └── test_integration.py
├── config/             # 설정 파일
│   ├── default.yaml   # 기본 설정
│   └── templates.yaml # 템플릿 설정
├── requirements.txt    # 의존성
├── setup.py           # 설치 스크립트
├── README.md          # 프로젝트 설명
└── .gitignore        # Git 제외 파일
```

## 주요 기능

### 1. 이미지 처리 (ImageProcessor)
- **자동 크롭**: 9:16 비율로 자동 크롭
- **리사이징**: 1080x1920 해상도로 조정
- **스마트 크롭**: 얼굴/객체 인식 기반 크롭
- **필터 적용**: 밝기, 대비, 채도 조정
- **배경 블러**: 배경 흐림 효과

### 2. 텍스트 처리 (TextProcessor)
- **자막 생성**: 텍스트를 자막으로 변환
- **타이밍 설정**: 자막 표시 시간 계산
- **스타일링**: 폰트, 색상, 크기, 애니메이션
- **위치 지정**: 상단/중앙/하단 배치
- **이모지 지원**: 이모지 렌더링

### 3. 비디오 생성 (VideoGenerator)
- **씬 구성**: 이미지와 텍스트 조합
- **트랜지션**: 페이드, 슬라이드, 줌 효과
- **타임라인**: 씬 순서 및 지속 시간 관리
- **렌더링**: 최종 비디오 생성
- **포맷**: MP4, WebM 지원

### 4. 오디오 처리 (AudioProcessor)
- **TTS**: 텍스트를 음성으로 변환
- **배경음악**: BGM 추가 및 볼륨 조절
- **효과음**: 트랜지션 효과음
- **믹싱**: 음성과 배경음악 믹싱
- **싱크**: 영상과 오디오 동기화

### 5. 템플릿 시스템
- **기본 템플릿**: 심플한 이미지+텍스트
- **뉴스 템플릿**: 뉴스 스타일 레이아웃
- **스토리 템플릿**: 스토리텔링용
- **제품 템플릿**: 제품 소개용
- **커스텀 템플릿**: 사용자 정의 가능

## 워크플로우

### 기본 워크플로우
1. **입력 수집**: 이미지와 스크립트 로드
2. **전처리**: 이미지 크롭/리사이징, 텍스트 파싱
3. **씬 생성**: 각 이미지-텍스트 쌍으로 씬 구성
4. **효과 적용**: 트랜지션, 애니메이션 추가
5. **오디오 생성**: TTS 및 배경음악 추가
6. **렌더링**: 최종 비디오 생성
7. **후처리**: 압축, 메타데이터 추가

### 자동화 파이프라인
```python
pipeline = ShortsPipeline()
pipeline.load_assets(images_path, script_path)
pipeline.apply_template('story')
pipeline.add_music('background.mp3')
pipeline.generate_tts(voice='ko-KR')
pipeline.render(output_path='output/shorts_001.mp4')
```

## 구현 단계

### Phase 1: 기본 구조 (1-2일)
- [x] 프로젝트 구조 생성
- [ ] 기본 클래스 설계
- [ ] 설정 시스템 구현
- [ ] 로깅 시스템 구현

### Phase 2: 이미지 처리 (2-3일)
- [ ] 이미지 로딩 및 검증
- [ ] 크롭 및 리사이징
- [ ] 필터 및 효과
- [ ] 배치 처리

### Phase 3: 텍스트 처리 (2-3일)
- [ ] 텍스트 파싱
- [ ] 자막 생성
- [ ] 스타일링 시스템
- [ ] 애니메이션

### Phase 4: 비디오 생성 (3-4일)
- [ ] 씬 매니저
- [ ] 트랜지션 효과
- [ ] 타임라인 관리
- [ ] 렌더링 엔진

### Phase 5: 오디오 처리 (2-3일)
- [ ] TTS 통합
- [ ] 배경음악 관리
- [ ] 오디오 믹싱
- [ ] 싱크 시스템

### Phase 6: 템플릿 시스템 (2-3일)
- [ ] 템플릿 인터페이스
- [ ] 기본 템플릿 구현
- [ ] 템플릿 커스터마이징
- [ ] 템플릿 저장/로드

### Phase 7: 통합 및 최적화 (2-3일)
- [ ] 파이프라인 통합
- [ ] 성능 최적화
- [ ] 에러 처리
- [ ] 테스트 작성

### Phase 8: API 및 UI (선택사항) (3-4일)
- [ ] REST API 구현
- [ ] 웹 UI 개발
- [ ] 배치 처리
- [ ] 모니터링

## 성능 목표
- **처리 속도**: 30초 쇼츠 생성 < 1분
- **해상도**: 1080x1920 (Full HD)
- **프레임레이트**: 30 FPS
- **파일 크기**: < 50MB (30초 기준)
- **동시 처리**: 최대 5개 비디오

## 확장 가능성
- **AI 통합**: 자동 스크립트 생성
- **음악 생성**: AI 기반 배경음악 생성
- **자동 편집**: 씬 자동 선택 및 편집
- **플랫폼 최적화**: 각 플랫폼별 최적화
- **분석 도구**: 생성된 콘텐츠 성과 분석

## 참고 자료
- MoviePy Documentation: https://zulko.github.io/moviepy/
- OpenCV Python: https://opencv.org/
- FFmpeg: https://ffmpeg.org/
- Edge-TTS: https://github.com/rany2/edge-tts