# 📖 Auto Shorts Generator 사용 가이드

## 📋 목차
1. [시작하기](#시작하기)
2. [기본 사용법](#기본-사용법)
3. [고급 기능](#고급-기능)
4. [템플릿 활용](#템플릿-활용)
5. [스크립트 작성법](#스크립트-작성법)
6. [팁과 트릭](#팁과-트릭)

## 시작하기

### 1. 설치

```bash
# 프로젝트 디렉토리로 이동
cd auto-shorts-generator

# Windows
run.bat

# Linux/Mac
chmod +x run.sh
./run.sh
```

### 2. 필수 준비물

- **이미지**: JPG, PNG 형식 (최소 3장 이상 권장)
- **스크립트**: TXT, JSON, YAML 형식의 텍스트 파일
- **배경음악** (선택): MP3, WAV 형식

## 기본 사용법

### 명령줄 인터페이스

```bash
# 기본 명령 구조
python src/main.py generate -i [이미지폴더] -s [스크립트파일] -o [출력파일]

# 실제 예제
python src/main.py generate \
    -i input/images \
    -s input/scripts/sample.txt \
    -o output/my_video.mp4 \
    -t modern \
    -m assets/music/bgm.mp3
```

### 옵션 설명

| 옵션 | 설명 | 필수 | 예시 |
|------|------|------|------|
| `-i, --images` | 이미지 폴더 경로 | ✅ | `input/images` |
| `-s, --script` | 스크립트 파일 경로 | ✅ | `input/scripts/text.txt` |
| `-o, --output` | 출력 비디오 경로 | ✅ | `output/video.mp4` |
| `-t, --template` | 템플릿 선택 | ❌ | `basic`, `modern`, `vintage` |
| `-m, --music` | 배경음악 파일 | ❌ | `assets/music/bgm.mp3` |
| `--no-tts` | TTS 비활성화 | ❌ | 플래그만 추가 |
| `-c, --config` | 설정 파일 경로 | ❌ | `config/custom.yaml` |

## 고급 기능

### Python 스크립트로 사용

```python
from src.main import ShortsGenerator

# 생성기 초기화
generator = ShortsGenerator()

# 커스텀 설정으로 생성
generator.generate_from_folder(
    images_folder="my_images/",
    script_file="my_script.json",
    output_path="output/custom_video.mp4",
    template="story",
    background_music="music.mp3",
    use_tts=True
)
```

### 배치 처리

```python
# 여러 비디오 한번에 생성
video_configs = [
    {
        "images_folder": "project1/images",
        "script_file": "project1/script.txt",
        "output_path": "output/project1.mp4",
        "template": "news"
    },
    {
        "images_folder": "project2/images",
        "script_file": "project2/script.json",
        "output_path": "output/project2.mp4",
        "template": "product"
    }
]

for config in video_configs:
    generator.generate_from_folder(**config)
```

### 커스텀 이미지 처리

```python
from src.core import ImageProcessor

processor = ImageProcessor()

# 이미지 로드 및 처리
image = processor.load_image("photo.jpg")

# 스마트 크롭 (얼굴 인식)
image = processor.resize_for_shorts(image, method='smart')

# 필터 적용
image = processor.apply_filter(image, 'vintage')

# 향상 적용
image = processor.apply_enhancement(
    image,
    brightness=1.2,  # 20% 밝게
    contrast=1.1,    # 10% 대비 증가
    saturation=1.3   # 30% 채도 증가
)

# 저장
processor.save_image(image, "processed.jpg")
```

## 템플릿 활용

### Basic (기본)
```python
# 심플한 이미지 슬라이드쇼
template="basic"
```
- 특징: 깔끔한 전환, 기본 자막
- 용도: 일반적인 콘텐츠

### Modern (모던)
```python
# 다이나믹한 현대적 스타일
template="modern"
```
- 특징: 선명한 색상, 빠른 전환
- 용도: 젊은 타겟층, 트렌디한 콘텐츠

### Vintage (빈티지)
```python
# 복고풍 필터와 효과
template="vintage"
```
- 특징: 따뜻한 색감, 비네팅 효과
- 용도: 감성적인 콘텐츠

### Story (스토리)
```python
# 스토리텔링에 최적화
template="story"
```
- 특징: Ken Burns 효과, 부드러운 전환
- 용도: 내러티브가 있는 콘텐츠

### News (뉴스)
```python
# 뉴스 스타일 레이아웃
template="news"
```
- 특징: 하단 자막바, 전문적인 느낌
- 용도: 정보 전달, 뉴스 콘텐츠

### Product (제품)
```python
# 제품 소개 최적화
template="product"
```
- 특징: 제품 포커스, 깔끔한 텍스트
- 용도: 상품 소개, 마케팅

## 스크립트 작성법

### 1. 간단한 텍스트 (.txt)

```text
# comments는 # 으로 시작
안녕하세요! 첫 번째 장면입니다.
두 번째 장면의 텍스트입니다.
마지막 장면입니다. 감사합니다!
```

### 2. 상세 설정 JSON (.json)

```json
{
  "scripts": [
    {
      "text": "환영합니다!",
      "duration": 3.0,
      "position": "center",
      "font_size": 52,
      "color": "#FFFF00",
      "animation": "fade",
      "animation_duration": 0.5
    },
    {
      "text": "구독과 좋아요 부탁드려요",
      "duration": 2.5,
      "position": "bottom",
      "font_size": 48,
      "color": "#FF0000",
      "animation": "slide"
    }
  ]
}
```

### 3. YAML 형식 (.yaml)

```yaml
scripts:
  - text: "첫 장면"
    duration: 3.0
    position: center
    font_size: 50
    color: "#FFFFFF"
    
  - text: "둘째 장면"
    duration: 2.5
    position: bottom
    animation: fade
```

### 텍스트 위치 옵션

- `top`: 상단
- `center`: 중앙
- `bottom`: 하단 (기본값)

### 애니메이션 옵션

- `none`: 애니메이션 없음
- `fade`: 페이드 인/아웃
- `slide`: 슬라이드
- `typewriter`: 타자기 효과

## 팁과 트릭

### 1. 이미지 최적화

```bash
# 이미지는 9:16 비율로 준비하면 최상의 결과
# 권장 해상도: 1080x1920
```

### 2. TTS 음성 선택

```python
# 한국어 여성 음성
voice = "ko-KR-SunHiNeural"

# 한국어 남성 음성  
voice = "ko-KR-InJoonNeural"

# 영어 여성 음성
voice = "en-US-JennyNeural"
```

### 3. 배경음악 볼륨 조절

```yaml
# config/default.yaml
audio:
  background_music:
    volume: 0.3  # 30% 볼륨
  tts:
    volume: 0.8  # 80% 볼륨
```

### 4. 성능 최적화

```yaml
# 빠른 처리를 위한 설정
processing:
  max_workers: 8  # CPU 코어 수에 맞춰 조정
  batch_size: 20  # 한번에 처리할 이미지 수
```

### 5. 파일 크기 최적화

```yaml
video:
  quality: "medium"  # high, medium, low
  bitrate: "3M"      # 비트레이트 조정
output:
  compress: true     # 자동 압축
  max_file_size: 30  # MB 단위
```

## 문제 해결

### FFmpeg 설치 확인

```bash
ffmpeg -version
```

### 메모리 부족 시

```python
# 이미지 배치 크기 줄이기
config.set('processing.batch_size', 3)
```

### TTS 생성 실패 시

```python
# 네트워크 연결 확인
# 대체 음성 사용
voice = "ko-KR-JiMinNeural"  # 다른 음성으로 시도
```

## 예제 프로젝트

### 1. 여행 브이로그

```bash
python src/main.py generate \
    -i travel_photos/ \
    -s travel_script.txt \
    -o travel_vlog.mp4 \
    -t story \
    -m relaxing_music.mp3
```

### 2. 제품 리뷰

```bash
python src/main.py generate \
    -i product_images/ \
    -s review_script.json \
    -o product_review.mp4 \
    -t product \
    --no-tts
```

### 3. 뉴스 형식

```bash
python src/main.py generate \
    -i news_images/ \
    -s news_script.yaml \
    -o daily_news.mp4 \
    -t news \
    -m news_bgm.mp3
```

## 추가 리소스

- [프로젝트 GitHub](https://github.com/your-repo)
- [FFmpeg 다운로드](https://ffmpeg.org)
- [무료 배경음악](https://freemusicarchive.org)
- [무료 이미지](https://unsplash.com)