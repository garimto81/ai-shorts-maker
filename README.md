# 🎬 Auto Shorts Generator

이미지와 텍스트를 조합하여 자동으로 YouTube Shorts, Instagram Reels, TikTok 등에 사용할 수 있는 짧은 동영상을 생성하는 시스템입니다.

## ✨ 주요 기능

- 📸 **이미지 처리**: 자동 크롭, 리사이징, 필터 적용
- 📝 **텍스트 처리**: 자막 생성, 애니메이션, 스타일링
- 🎥 **비디오 생성**: 트랜지션, 효과, 템플릿 적용
- 🎵 **오디오 처리**: TTS 나레이션, 배경음악, 효과음
- 🎨 **템플릿 시스템**: 다양한 스타일 템플릿 제공

## 🚀 빠른 시작

### 설치

```bash
# 저장소 클론
cd auto-shorts-generator

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 의존성 설치
pip install -r requirements.txt
```

### 기본 사용법

```bash
# 이미지 폴더와 스크립트 파일로 쇼츠 생성
python src/main.py generate \
    -i input/images \
    -s input/scripts/sample.txt \
    -o output/my_shorts.mp4 \
    -t basic \
    -m assets/music/background.mp3
```

### 설정 파일 사용

```bash
# JSON 설정 파일로 생성
python src/main.py from-config config/generation.json
```

## 📁 프로젝트 구조

```
auto-shorts-generator/
├── src/
│   ├── core/              # 핵심 모듈
│   │   ├── image_processor.py    # 이미지 처리
│   │   ├── text_processor.py     # 텍스트 처리
│   │   ├── video_generator.py    # 비디오 생성
│   │   ├── audio_processor.py    # 오디오 처리
│   │   └── effects.py           # 효과 관리
│   ├── utils/             # 유틸리티
│   └── main.py           # 메인 실행 파일
├── assets/               # 리소스 파일
├── input/                # 입력 파일
├── output/               # 생성된 비디오
└── config/               # 설정 파일
```

## 📝 스크립트 형식

### 텍스트 파일 (.txt)
```
첫 번째 장면의 텍스트
두 번째 장면의 텍스트
세 번째 장면의 텍스트
```

### JSON 파일 (.json)
```json
{
  "scripts": [
    {
      "text": "첫 번째 장면",
      "duration": 3.0,
      "position": "bottom",
      "animation": "fade"
    },
    {
      "text": "두 번째 장면",
      "duration": 2.5,
      "position": "center"
    }
  ]
}
```

### YAML 파일 (.yaml)
```yaml
scripts:
  - text: "첫 번째 장면"
    duration: 3.0
    position: bottom
    animation: fade
  - text: "두 번째 장면"
    duration: 2.5
    position: center
```

## 🎨 템플릿 종류

- **basic**: 기본 템플릿 (심플한 이미지+텍스트)
- **news**: 뉴스 스타일 (하단 자막, 뉴스 효과)
- **story**: 스토리텔링 (Ken Burns 효과, 감성적)
- **product**: 제품 소개 (깔끔한 디자인, 제품 포커스)
- **vintage**: 빈티지 스타일 (필터, 비네팅 효과)
- **modern**: 모던 스타일 (선명한 색상, 다이나믹)

## ⚙️ 설정 옵션

`config/default.yaml` 파일에서 다양한 옵션 설정 가능:

- **비디오 설정**: 해상도, FPS, 코덱, 품질
- **이미지 설정**: 지속 시간, 트랜지션, 리사이즈 방법
- **텍스트 설정**: 폰트, 크기, 색상, 위치, 애니메이션
- **오디오 설정**: TTS 음성, 볼륨, 배경음악

## 🎬 생성 예제

### 1. 기본 쇼츠 생성

```python
from src.main import ShortsGenerator

generator = ShortsGenerator()
generator.generate_from_folder(
    images_folder="input/images",
    script_file="input/scripts/sample.txt",
    output_path="output/basic_shorts.mp4",
    template="basic"
)
```

### 2. TTS 나레이션 포함

```python
generator.generate_from_folder(
    images_folder="input/images",
    script_file="input/scripts/narration.txt",
    output_path="output/narrated_shorts.mp4",
    template="story",
    use_tts=True
)
```

### 3. 배경음악 추가

```python
generator.generate_from_folder(
    images_folder="input/images",
    script_file="input/scripts/sample.txt",
    output_path="output/music_shorts.mp4",
    template="modern",
    background_music="assets/music/upbeat.mp3"
)
```

## 🛠️ 고급 사용법

### 커스텀 효과 적용

```python
from src.core import ImageProcessor, EffectsManager

# 이미지에 커스텀 효과 적용
processor = ImageProcessor()
image = processor.load_image("image.jpg")
image = processor.apply_filter(image, "vintage")
image = processor.apply_enhancement(image, brightness=1.2)

# 비디오 효과 적용
effects = EffectsManager()
clip = effects.apply_ken_burns(clip, zoom_ratio=1.3)
clip = effects.apply_vignette(clip, intensity=0.6)
```

### 배치 처리

```python
# 여러 비디오 한 번에 생성
configs = [
    {"images": "set1/", "script": "script1.txt", "output": "video1.mp4"},
    {"images": "set2/", "script": "script2.txt", "output": "video2.mp4"},
]

for config in configs:
    generator.generate_from_folder(**config)
```

## 📊 성능 최적화

- **병렬 처리**: 이미지 처리 시 멀티프로세싱 활용
- **캐싱**: 처리된 이미지와 오디오 캐싱
- **압축**: 최종 비디오 자동 압축 (H.264 코덱)
- **메모리 관리**: 대용량 파일 스트리밍 처리

## 🐛 문제 해결

### FFmpeg 관련 오류
```bash
# FFmpeg 설치 확인
ffmpeg -version

# Windows에서 FFmpeg 설치
# https://ffmpeg.org/download.html 에서 다운로드
```

### 폰트 관련 오류
```bash
# 폰트 파일을 assets/fonts/ 폴더에 복사
# 지원 형식: .ttf, .otf
```

### 메모리 부족
```yaml
# config/default.yaml에서 조정
processing:
  max_workers: 2  # 워커 수 줄이기
  batch_size: 5   # 배치 크기 줄이기
```

## 📝 라이선스

MIT License

## 🤝 기여하기

Pull Request와 이슈 제보를 환영합니다!

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.