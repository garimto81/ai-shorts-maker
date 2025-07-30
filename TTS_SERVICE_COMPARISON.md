# 🎙️ 자연스러운 한국어 TTS 서비스 비교 및 추천

## 📊 주요 TTS 서비스 비교

### 1. **ElevenLabs** ⭐⭐⭐⭐⭐ (최고 품질)
- **장점**
  - ✅ 가장 자연스러운 음성 (감정 표현 뛰어남)
  - ✅ 음성 복제 기능 (자신만의 음성 생성 가능)
  - ✅ 실시간 스트리밍 지원
  - ✅ 29개 언어 지원 (한국어 포함)
- **단점**
  - ❌ 유료 (무료 티어: 월 10,000자)
  - ❌ API 응답 속도가 다소 느림
- **가격**: $5/월부터 (Starter)
- **음질**: ⭐⭐⭐⭐⭐

### 2. **Google Cloud Text-to-Speech** ⭐⭐⭐⭐ (균형잡힌 선택)
- **장점**
  - ✅ 다양한 한국어 음성 (Neural2, WaveNet)
  - ✅ SSML 완벽 지원
  - ✅ 빠른 응답 속도
  - ✅ 합리적인 가격
- **단점**
  - ❌ 감정 표현이 ElevenLabs보다 부족
  - ❌ 초기 설정이 복잡
- **가격**: 무료 티어 월 100만자, 이후 $4/100만자
- **음질**: ⭐⭐⭐⭐

### 3. **Naver CLOVA Voice** ⭐⭐⭐⭐ (한국어 특화)
- **장점**
  - ✅ 한국어에 최적화 (자연스러운 억양)
  - ✅ 다양한 한국인 음성
  - ✅ 빠른 처리 속도
  - ✅ 한국 기업 서비스
- **단점**
  - ❌ 한국어만 지원
  - ❌ API 문서가 영어 대비 부족
- **가격**: 무료 티어 있음, 유료는 사용량 기반
- **음질**: ⭐⭐⭐⭐

### 4. **Microsoft Azure Speech** ⭐⭐⭐⭐
- **장점**
  - ✅ 뉴럴 음성 품질 우수
  - ✅ 실시간 스트리밍
  - ✅ 다양한 감정 스타일
  - ✅ 무료 크레딧 제공
- **단점**
  - ❌ 한국어 음성 선택지 적음
  - ❌ 설정 복잡
- **가격**: 무료 티어 월 50만자
- **음질**: ⭐⭐⭐⭐

### 5. **Amazon Polly** ⭐⭐⭐
- **장점**
  - ✅ AWS 생태계 통합
  - ✅ 안정적인 서비스
  - ✅ SSML 지원
- **단점**
  - ❌ 한국어 음성 품질 평범
  - ❌ 감정 표현 제한적
- **가격**: 무료 티어 월 100만자 (첫 12개월)
- **음질**: ⭐⭐⭐

### 6. **Typecast** ⭐⭐⭐⭐ (AI 성우 특화)
- **장점**
  - ✅ 400+ AI 성우 (한국어 다수)
  - ✅ 감정/스타일 세밀 조정
  - ✅ 웹 에디터 제공
- **단점**
  - ❌ API 제한적
  - ❌ 가격이 비쌈
- **가격**: $7.99/월부터
- **음질**: ⭐⭐⭐⭐

## 🎯 용도별 추천

### 🏆 **최고 품질 원할 때**: ElevenLabs
```javascript
// ElevenLabs 구현 예시
const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/voice-id', {
  method: 'POST',
  headers: {
    'xi-api-key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "안녕하세요. 가장 자연스러운 음성입니다.",
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  })
});
```

### 💰 **가성비 좋은 선택**: Google Cloud TTS
```javascript
// Google Cloud TTS 구현
const request = {
  input: { text: '안녕하세요' },
  voice: {
    languageCode: 'ko-KR',
    name: 'ko-KR-Neural2-C',  // 여성
    // name: 'ko-KR-Neural2-B',  // 남성
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0,
    volumeGainDb: 0
  }
};
```

### 🇰🇷 **한국어 전문**: Naver CLOVA
```javascript
// Naver CLOVA 구현
const response = await fetch('https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
  method: 'POST',
  headers: {
    'X-NCP-APIGW-API-KEY-ID': 'your-client-id',
    'X-NCP-APIGW-API-KEY': 'your-client-secret',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    speaker: 'nara',  // 또는 'clara', 'matt', 'shinji'
    text: '안녕하세요',
    speed: '0',
    pitch: '0',
    format: 'mp3'
  })
});
```

## 💡 AI Shorts Maker를 위한 최적 선택

### 🏅 추천 순위

1. **ElevenLabs** (예산이 충분한 경우)
   - 자동차 정비 영상: 전문적이고 신뢰감 있는 음성
   - 감정 표현이 자연스러워 시청자 몰입도 높음
   
2. **Google Cloud TTS** (균형잡힌 선택)
   - 무료 티어로 충분히 시작 가능
   - SSML로 세밀한 제어 가능
   - 안정적이고 빠른 응답

3. **Naver CLOVA** (한국 콘텐츠 전용)
   - 한국어 억양과 발음이 가장 자연스러움
   - 국내 서비스라 지원이 편함

## 🚀 즉시 구현 가능한 코드

### ElevenLabs 통합 (lib/elevenlabs-tts.ts)
```typescript
export class ElevenLabsTTS {
  private apiKey: string;
  private voiceId: string = 'pNInz6obpgDQGcFmaJgB'; // Adam (한국어 지원)

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpeech(
    text: string,
    options?: {
      stability?: number;
      similarity?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<Buffer> {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: options?.stability ?? 0.75,
            similarity_boost: options?.similarity ?? 0.75,
            style: options?.style ?? 0.5,
            use_speaker_boost: options?.speakerBoost ?? true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  }
}
```

## 📝 설정 방법

### 1. ElevenLabs
1. [ElevenLabs](https://elevenlabs.io) 가입
2. API Key 발급 (Profile → API Key)
3. `.env.local`에 추가:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```

### 2. Google Cloud TTS
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Text-to-Speech API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. `.env.local`에 추가:
   ```
   GOOGLE_CLOUD_API_KEY=your_api_key_here
   ```

### 3. Naver CLOVA
1. [Naver Cloud Platform](https://www.ncloud.com) 가입
2. CLOVA Voice 신청
3. 인증 정보 발급
4. `.env.local`에 추가:
   ```
   NAVER_CLIENT_ID=your_client_id
   NAVER_CLIENT_SECRET=your_client_secret
   ```

## 🎬 자동차 정비 영상을 위한 최종 추천

**ElevenLabs + 한국어 음성 복제**가 최선의 선택입니다:
1. 전문 성우의 목소리를 복제하여 사용
2. 일관된 브랜드 보이스 유지
3. 감정 표현으로 시청자 몰입도 향상

**예산이 제한적이라면 Google Cloud TTS**:
1. Neural2 음성으로 충분히 자연스러움
2. SSML로 전문적인 톤 구현 가능
3. 무료 티어로 시작 가능

---

*이 문서는 2025년 1월 기준 최신 정보입니다.*