# 🎙️ TTS 시스템 개선 사항 v2 (2025.01.31)

## 📋 개요
AI Shorts Maker의 TTS(Text-to-Speech) 시스템을 ElevenLabs API 최신 기술로 전면 개선하여 자연스러운 한국어 음성 생성 구현

## 🚀 주요 개선 사항

### 1. 고주파 소리 문제 해결
- **문제**: 기존 시스템에서 440Hz 사인파 생성으로 인한 고주파 소리 발생
- **해결**: 
  - ElevenLabs API 통합으로 실제 음성 생성
  - 더미 오디오 생성 코드를 무음으로 변경
  - `lib/gemini-tts.ts`에서 실제 TTS API 우선 사용

### 2. ElevenLabs API 통합
- **구현 파일**:
  - `lib/elevenlabs-tts.ts`: ElevenLabs API 클라이언트
  - `lib/natural-korean-tts-v3.ts`: 한국어 최적화 설정
  - `pages/api/tts/elevenlabs.ts`: 전용 API 엔드포인트

- **주요 기능**:
  - 8개의 다양한 한국어 지원 음성
  - 비디오 타입별 자동 음성 선택
  - 사용량 추적 및 메타데이터 제공

### 3. 한국어 음성 자연스러움 개선

#### 3.1 SSML(Speech Synthesis Markup Language) 적용
```xml
<speak>
  안녕하세요,<break time='0.3s'/> 
  오늘은 <emphasis>특별한</emphasis> 날입니다.<break time='0.5s'/>
</speak>
```

#### 3.2 최적화된 음성 설정
```javascript
const optimalKoreanSettings = {
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.45,        // 자연스러운 억양 변화
    similarity_boost: 0.65, // 음성 일관성
    style: 0,              // 안정성을 위해 0 유지
    use_speaker_boost: true
  },
  enable_ssml_parsing: true
};
```

#### 3.3 텍스트 전처리 개선
- 숫자를 한글로 변환: `2025년` → `이천이십오년`
- 영어 약어 발음 개선: `BMW` → `B-M-W`
- 자연스러운 쉼 추가: 문장 끝과 쉼표에 적절한 break 태그

### 4. 비디오 타입별 음성 자동 선택

| 비디오 타입 | 선택 음성 | 특징 |
|------------|----------|------|
| `auto_repair` | Adam (남성) | 전문적, 신뢰감 있는 톤 |
| `tutorial` | Rachel (여성) | 친근하고 명확한 톤 |
| `advertisement` | Elli (여성) | 활기차고 열정적인 톤 |
| `narration` | Bill (남성) | 차분하고 안정적인 톤 |
| `educational` | Rachel (여성) | 명확하고 이해하기 쉬운 톤 |

## 📁 새로 추가된 파일

### 핵심 구현 파일
- `lib/elevenlabs-tts.ts` - ElevenLabs API 통합
- `lib/korean-optimized-tts.ts` - 한국어 최적화 설정
- `lib/natural-korean-tts-v2.ts` - 자연스러운 한국어 설정 v2
- `lib/natural-korean-tts-v3.ts` - SSML 적용 최신 버전
- `pages/api/tts/elevenlabs.ts` - ElevenLabs 전용 API 엔드포인트

### 문서화 파일
- `TTS_SERVICE_COMPARISON.md` - TTS 서비스 비교 분석
- `ELEVENLABS_SETUP.md` - ElevenLabs 설정 가이드
- `TTS_IMPROVEMENTS_V2.md` - 개선 사항 정리 (현재 파일)

### 테스트 파일
- `test-elevenlabs-integration.js` - 통합 테스트
- `test-tts-system.js` - 시스템 구조 검증
- `generate-voice-samples.js` - 음성 샘플 생성
- `generate-lively-korean-voices.js` - 활기찬 한국어 음성
- `generate-exciting-ad-voices.js` - 광고용 음성
- `test-natural-korean-v3.js` - SSML 적용 테스트

### 고급 설정 파일
- `lib/tts-text-preprocessor.ts` - 텍스트 전처리기
- `lib/ssml-builder.ts` - SSML 마크업 생성기
- `lib/advanced-tts-config.ts` - 고급 TTS 설정
- `lib/enhanced-gemini-tts.ts` - 향상된 Gemini TTS

## 🔧 환경 설정

### .env.local 설정
```bash
# ElevenLabs API 키 (필수)
ELEVENLABS_API_KEY=your_api_key_here

# 선택적 TTS 서비스
GOOGLE_CLOUD_API_KEY=your_google_api_key
NAVER_CLIENT_ID=your_naver_id
NAVER_CLIENT_SECRET=your_naver_secret
```

## 📊 성능 개선 결과

### Before (기존 시스템)
- ❌ 440Hz 고주파 소리 생성
- ❌ 기계적이고 부자연스러운 한국어 억양
- ❌ 실제 음성이 아닌 더미 오디오

### After (개선된 시스템)
- ✅ 자연스러운 한국어 음성 생성
- ✅ SSML로 정확한 억양과 쉼 구현
- ✅ 비디오 타입별 최적 음성 자동 선택
- ✅ 숫자와 영어 발음 자연스럽게 처리

## 🎯 핵심 개선 포인트

1. **SSML 적용**: `<break>` 태그로 자연스러운 쉼, `<emphasis>` 태그로 강조
2. **최적 설정값**: Stability 0.45, Style 0 (Multilingual v2)
3. **텍스트 전처리**: 숫자→한글, 영어 약어→하이픈 분리
4. **문맥 유지**: previous_text, next_text로 자연스러운 흐름

## 🚀 사용 방법

### 1. 기본 TTS 생성
```javascript
// POST /api/tts/generate
{
  "text": "안녕하세요. AI Shorts Maker입니다.",
  "videoType": "tutorial"
}
```

### 2. ElevenLabs 직접 호출
```javascript
// POST /api/tts/elevenlabs
{
  "text": "안녕하세요. 자연스러운 음성입니다.",
  "video_type": "narration",
  "voice_settings": {
    "stability": 0.45,
    "similarity_boost": 0.65,
    "style": 0,
    "use_speaker_boost": true
  }
}
```

## 📈 향후 개선 계획

1. **Eleven v3 Alpha 도입**: 감정 태그 지원으로 더 풍부한 표현
2. **음성 복제(IVC)**: 한국 성우 음성으로 커스텀 보이스 생성
3. **실시간 스트리밍**: Flash v2.5 모델로 75ms 지연 시간 구현
4. **다국어 지원**: 일본어, 중국어 등 추가 언어 지원

## 📝 참고 사항

- ElevenLabs 무료 플랜: 월 10,000자
- 유료 플랜($5/월): 월 30,000자
- 한국어는 `eleven_multilingual_v2` 모델 사용 권장
- SSML 태그는 과도하게 사용하면 오디오 아티팩트 발생 가능

---

*마지막 업데이트: 2025년 1월 31일*
*작성자: AI Shorts Maker 개발팀*