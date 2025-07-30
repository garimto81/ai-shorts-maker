# 🎙️ ElevenLabs API 설정 가이드

## 빠른 시작 (5분 소요)

### 1. ElevenLabs 계정 생성
1. [ElevenLabs](https://elevenlabs.io) 접속
2. "Sign Up" 클릭하여 무료 계정 생성
3. 이메일 인증 완료

### 2. API 키 발급
1. 로그인 후 프로필 아이콘 클릭
2. "Profile + API key" 선택
3. "API Key" 섹션에서 키 복사

### 3. 프로젝트에 API 키 설정
`.env.local` 파일에 다음 추가:
```
ELEVENLABS_API_KEY=your_api_key_here
```

### 4. 서버 재시작
```bash
# 개발 서버 재시작
npm run dev
```

## 🧪 테스트 방법

### 1. 통합 테스트 실행
```bash
node test-elevenlabs-integration.js
```

### 2. 수동 테스트 (curl)
```bash
curl -X POST http://localhost:3000/api/tts/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요. ElevenLabs 음성 테스트입니다.",
    "video_type": "narration"
  }'
```

### 3. 생성된 음성 확인
- 응답에서 `audioUrl` 확인
- 브라우저에서 `http://localhost:3000{audioUrl}` 접속
- 자연스러운 한국어 음성이 재생되는지 확인

## 📊 무료 플랜 정보

### 무료 티어 제한
- **월 10,000 문자** (약 100개 짧은 영상)
- 3개 커스텀 음성
- 상업적 사용 불가

### 유료 플랜 (Starter - $5/월)
- **월 30,000 문자**
- 10개 커스텀 음성
- 상업적 사용 가능
- 우선 처리

## 🎯 영상 타입별 자동 음성 선택

시스템이 자동으로 최적의 음성을 선택합니다:

| 영상 타입 | 선택되는 음성 | 특징 |
|-----------|--------------|------|
| `auto_repair` | Adam (남성) | 전문적, 신뢰감 |
| `tutorial` | Rachel (여성) | 친근함, 명확함 |
| `advertisement` | Elli (여성) | 활기참, 열정적 |
| `narration` | Bill (남성) | 차분함, 안정적 |
| `educational` | Rachel (여성) | 명확함, 이해하기 쉬움 |

## 🔧 문제 해결

### API 키 오류
```json
{
  "success": false,
  "error": "ElevenLabs API가 구성되지 않았습니다."
}
```
**해결**: `.env.local`에 `ELEVENLABS_API_KEY` 설정

### 문자 한도 초과
```json
{
  "error": "Quota exceeded"
}
```
**해결**: 
- 무료 플랜: 다음 달까지 대기
- 유료 플랜으로 업그레이드

### 음성이 생성되지 않음
1. API 키가 올바른지 확인
2. ElevenLabs 대시보드에서 사용량 확인
3. 네트워크 연결 확인

## 🚀 고급 설정

### 커스텀 음성 설정
```javascript
// pages/api/tts/elevenlabs.ts에서 수정
const customSettings = {
  stability: 0.8,        // 음성 안정성 (0-1)
  similarity_boost: 0.7, // 원본 유사성 (0-1)
  style: 0.5,           // 스타일 강도 (0-1)
  use_speaker_boost: true // 음성 향상
};
```

### 다른 언어 지원
ElevenLabs는 29개 언어를 지원합니다:
- 한국어 (ko)
- 영어 (en)
- 일본어 (ja)
- 중국어 (zh)
- 스페인어 (es)
- 프랑스어 (fr)
- 등등...

## 📞 지원

- [ElevenLabs 문서](https://docs.elevenlabs.io)
- [API 레퍼런스](https://docs.elevenlabs.io/api-reference)
- 이메일: support@elevenlabs.io

---

설정이 완료되면 고주파 소리 대신 자연스러운 한국어 음성이 생성됩니다! 🎉