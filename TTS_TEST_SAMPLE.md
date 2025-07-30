# 🎙️ AI Shorts Maker - 자연스러운 음성 테스트 샘플

## 📋 테스트 방법

### 1. 기본 TTS 테스트
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요. AI Shorts Maker 기본 음성 테스트입니다.",
    "voice": "Kore",
    "speed": "normal",
    "style": "neutral",
    "language": "ko",
    "enhanced": false
  }'
```

### 2. 향상된 TTS 테스트 (자연스러운 음성)
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요. AI Shorts Maker 향상된 음성 테스트입니다. 더 자연스럽고 표현력 있는 음성을 들려드리겠습니다.",
    "voice": "Kore",
    "speed": "normal",
    "style": "cheerful",
    "language": "ko",
    "enhanced": true,
    "preset": "narration"
  }'
```

### 3. 자동차 정비 영상 나레이션 테스트
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "오늘 입고된 차는 BMW X5 차량입니다. 1억이 넘어가는 고가의 차량이 휠 기스로 인해서 들어오는 모습이 상당히 가슴이 아팠습니다. 일단 유분 제거를 철저히 해주고, 세척과 샌딩 후 전용 컷팅을 해서 작업을 했더니 다시금 신차급 퍼포먼스를 보여줍니다.",
    "enhanced": true,
    "videoType": "auto_repair",
    "keywords": ["BMW", "X5", "휠 기스", "신차급", "퍼포먼스"],
    "formalTone": true
  }'
```

## 🎬 영상 타입별 샘플 스크립트

### 1. 자동차 정비 (auto_repair)
```json
{
  "text": "오늘은 SM6 차량의 휠복원 과정을 보여드리겠습니다. 휠굴절과 크랙을 확인한 후, 샌드블라스터로 유분을 제거하고 CNC 공정을 진행했습니다. 마지막으로 클리어코트를 도포하여 완벽하게 새 휠처럼 복원했습니다. 고객님도 저희도 모두 만족한 작업이었습니다.",
  "enhanced": true,
  "videoType": "auto_repair",
  "keywords": ["휠복원", "샌드블라스터", "CNC", "클리어코트"],
  "formalTone": true
}
```

### 2. 튜토리얼 (tutorial)
```json
{
  "text": "안녕하세요. 오늘은 포토샵에서 배경을 제거하는 방법을 알려드리겠습니다. 먼저 이미지를 열고, 빠른 선택 도구를 선택합니다. 다음으로 제거하고 싶은 배경 부분을 클릭하고 드래그합니다. 마지막으로 Delete 키를 눌러 배경을 제거합니다. 정말 간단하죠?",
  "enhanced": true,
  "videoType": "tutorial",
  "keywords": ["포토샵", "배경 제거", "빠른 선택 도구"],
  "formalTone": false
}
```

### 3. 광고 (advertisement)
```json
{
  "text": "놀라운 기회! 지금 바로 신제품을 만나보세요! 최고의 품질과 합리적인 가격으로 여러분을 찾아갑니다. 오늘만 특별 할인 30%! 놓치면 후회하는 기회, 지금 바로 주문하세요!",
  "enhanced": true,
  "videoType": "advertisement",
  "keywords": ["놀라운", "최고", "특별 할인", "지금 바로"]
}
```

### 4. 교육 (educational)
```json
{
  "text": "오늘은 태양계에 대해 알아보겠습니다. 태양계는 태양을 중심으로 8개의 행성이 공전하는 천체 시스템입니다. 수성, 금성, 지구, 화성은 암석형 행성이고, 목성, 토성, 천왕성, 해왕성은 가스형 행성입니다. 각 행성은 고유한 특징을 가지고 있습니다.",
  "enhanced": true,
  "videoType": "educational",
  "keywords": ["태양계", "행성", "태양", "지구"],
  "formalTone": true
}
```

### 5. 스토리텔링 (story)
```json
{
  "text": "옛날 옛적에 작은 마을에 한 소년이 살았습니다. 그 소년은 매일 밤 하늘의 별을 보며 꿈을 꾸었습니다. 어느 날, 신비로운 빛이 하늘에서 내려왔고, 소년의 모험이 시작되었습니다. 그것은 정말 놀라운 여행의 시작이었습니다.",
  "enhanced": true,
  "preset": "storytelling",
  "keywords": ["옛날", "소년", "별", "모험", "놀라운"]
}
```

## 🔧 고급 설정 테스트

### 프리셋별 테스트
```javascript
// 나레이션 프리셋
{
  "text": "여러분의 이야기를 들려드립니다...",
  "enhanced": true,
  "preset": "narration"
}

// 뉴스 프리셋
{
  "text": "오늘 주요 뉴스를 전해드립니다...",
  "enhanced": true,
  "preset": "news"
}

// 광고 프리셋
{
  "text": "특별한 제품을 소개합니다...",
  "enhanced": true,
  "preset": "advertisement"
}
```

### 키워드 강조 테스트
```javascript
{
  "text": "이 제품의 핵심은 품질입니다. 최고의 품질로 만족을 드립니다.",
  "enhanced": true,
  "keywords": ["핵심", "품질", "최고", "만족"]
}
```

### 감정 표현 테스트
```javascript
// 차분한 톤
{
  "text": "편안하고 고요한 순간을 느껴보세요.",
  "enhanced": true,
  "style": "calm"
}

// 활기찬 톤
{
  "text": "정말 신나는 소식이 있습니다!",
  "enhanced": true,
  "style": "excited"
}

// 전문적인 톤
{
  "text": "본 제품의 기술적 사양을 설명드리겠습니다.",
  "enhanced": true,
  "style": "professional"
}
```

## 📊 테스트 결과 확인 사항

### 향상된 TTS 확인 포인트
1. **숫자 변환**: "1억원" → "일억원"으로 자연스럽게 읽기
2. **영어 변환**: "BMW" → "비엠더블유"로 한글 발음
3. **일시정지**: 문장 사이 자연스러운 숨쉬기
4. **키워드 강조**: 중요 단어가 더 명확하게 들리는지
5. **감정 표현**: 스타일에 따른 톤 변화

### 성능 지표
- **처리 시간**: 향상된 TTS가 기본보다 약간 더 걸림 (정상)
- **파일 크기**: SSML 처리로 인해 약간 증가 가능
- **음질**: 더 자연스럽고 표현력 있는 음성

## 🎯 권장 사용법

### 영상 제작 시
1. **영상 타입 지정**: `videoType` 파라미터로 최적화된 음성 생성
2. **키워드 강조**: 중요한 단어를 `keywords` 배열에 추가
3. **격식체 변환**: 전문적인 영상은 `formalTone: true` 사용

### 품질 향상을 위해
1. **문장 정리**: 너무 긴 문장은 적절히 나누기
2. **구두점 사용**: 마침표, 쉼표를 정확히 사용
3. **숫자 표기**: 한글로 쓰면 더 자연스러움

---

*이 문서는 AI Shorts Maker의 향상된 TTS 기능 테스트를 위한 가이드입니다.*