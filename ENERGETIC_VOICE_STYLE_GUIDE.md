# 🎉 활기찬 한국어 음성 스타일 가이드

## 📋 개요
AI Shorts Maker에서 밝고 활기차며 에너지 넘치는 한국어 음성을 생성하기 위한 스타일 가이드

## 🎯 핵심 특징

### 1. 음성 설정값
```javascript
const energeticVoiceSettings = {
  stability: 0.42,        // 다이나믹한 톤 변화
  similarity_boost: 0.63, // 자연스러움 유지
  style: 0,              // 안정성 (Multilingual v2)
  use_speaker_boost: true
};
```

### 2. SSML 프로소디 설정
- **속도**: 105-112% (감정에 따라 조절)
- **음높이**: +7~+12% (밝고 높은 톤)
- **볼륨**: medium-loud (상황에 따라)

```xml
<prosody rate="108%" pitch="+8%">
  텍스트 내용
</prosody>
```

## 🎭 감정별 세부 설정

### 1. Excited (신남)
```xml
<prosody rate="108%" pitch="+8%">
```
- 일반적인 신나는 상황
- 아침 인사, 일상적인 기쁨

### 2. Motivated (동기부여)
```xml
<prosody rate="110%" pitch="+10%" volume="loud">
```
- 운동, 도전, 격려
- 강한 에너지와 추진력

### 3. Enthusiastic (열정적)
```xml
<prosody rate="112%" pitch="+12%">
```
- 제품 소개, 이벤트 발표
- 최고조의 흥분과 기대감

### 4. Cheerful (명랑함)
```xml
<prosody rate="105%" pitch="+7%">
```
- 친근한 대화, 일상적인 즐거움
- 부드럽지만 밝은 톤

### 5. Celebratory (축하)
```xml
<prosody rate="110%" pitch="+10%">
```
- 성공, 달성, 축하
- 기쁨과 자부심이 담긴 톤

## 🎙️ 추천 음성 모델

### 여성 음성
1. **Elli (MF3mGyEYCl7XYWbV9V6O)**
   - 가장 활기차고 에너지 넘치는 여성 음성
   - 광고, 프로모션에 최적

2. **Domi (AZnzlk1XvdvUeBnXmlld)**
   - 젊고 발랄한 여성 음성
   - 신제품 소개, 트렌디한 콘텐츠

3. **Rachel (21m00Tcm4TlvDq8ikWAM)**
   - 따뜻하면서도 밝은 여성 음성
   - 축하, 격려 메시지

### 남성 음성
1. **Josh (TxGEqnHWrfWFTfGW9XjX)**
   - 젊고 활기찬 남성 음성
   - 스포츠, 게임, 동기부여

2. **Adam (pNInz6obpgDQGcFmaJgB)**
   - 친근하고 신뢰감 있는 남성 음성
   - 튜토리얼, 안내

## 📝 텍스트 처리 규칙

### 1. 강조 단어 처리
```xml
<emphasis level="strong">정말</emphasis>
<emphasis level="strong">너무</emphasis>
<emphasis level="strong">대단해요</emphasis>
```

### 2. 특수 표현 처리
```xml
<!-- 감탄사 -->
<prosody pitch="+15%" rate="110%">와!</prosody>

<!-- 파이팅 -->
<prosody pitch="+20%" rate="120%">파이팅</prosody>

<!-- 의문문 -->
<prosody pitch="+15%">요?</prosody>
```

### 3. 리듬 생성
```xml
<!-- 느낌표 뒤 짧은 쉼 -->
!<break time="100ms"/>

<!-- 문장 사이 적절한 쉼 -->
.<break time="150ms"/>
```

## 🔧 구현 예시

### 기본 구현
```javascript
function generateEnergeticVoice(text, emotion = 'excited') {
  // SSML 처리
  const ssml = processEnergeticText(text, emotion);
  
  // API 요청
  const request = {
    text: ssml,
    model_id: "eleven_multilingual_v2",
    voice_id: selectEnergeticVoice(),
    voice_settings: energeticVoiceSettings,
    enable_ssml_parsing: true
  };
  
  return elevenLabsAPI.textToSpeech(request);
}
```

### 감정별 프로세싱
```javascript
function processEnergeticText(text, emotion) {
  // 기본 강조 처리
  text = text.replace(/정말/g, '<emphasis level="strong">정말</emphasis>');
  text = text.replace(/!/g, '!<break time="100ms"/>');
  
  // 감정별 프로소디 적용
  const prosodySettings = {
    excited: { rate: "108%", pitch: "+8%" },
    motivated: { rate: "110%", pitch: "+10%", volume: "loud" },
    enthusiastic: { rate: "112%", pitch: "+12%" },
    cheerful: { rate: "105%", pitch: "+7%" },
    celebratory: { rate: "110%", pitch: "+10%" }
  };
  
  const settings = prosodySettings[emotion] || prosodySettings.excited;
  
  return `<speak><prosody rate="${settings.rate}" pitch="${settings.pitch}" 
    ${settings.volume ? `volume="${settings.volume}"` : ''}>${text}</prosody></speak>`;
}
```

## 📊 사용 사례

### 1. 광고/프로모션
- 음성: Elli (여성) 또는 Josh (남성)
- 감정: enthusiastic
- 특징: 최대 에너지, 긴급감 표현

### 2. 튜토리얼/안내
- 음성: Rachel (여성) 또는 Adam (남성)
- 감정: cheerful
- 특징: 친근하고 명확한 전달

### 3. 동기부여/운동
- 음성: Josh (남성) 또는 Elli (여성)
- 감정: motivated
- 특징: 강한 추진력, 격려

### 4. 축하/성공
- 음성: Rachel (여성) 또는 Adam (남성)
- 감정: celebratory
- 특징: 기쁨과 자부심 표현

## 🎯 품질 체크리스트

- [ ] 속도가 105% 이상으로 설정되었는가?
- [ ] 음높이가 +7% 이상으로 설정되었는가?
- [ ] 강조 단어에 emphasis 태그가 적용되었는가?
- [ ] 느낌표 뒤에 적절한 쉼이 있는가?
- [ ] Stability가 0.42 근처로 설정되었는가?
- [ ] SSML 파싱이 활성화되었는가?

## 📈 최적화 팁

1. **문장 길이**: 짧고 임팩트 있는 문장 사용
2. **감탄사 활용**: "와!", "대박!", "정말!" 등 적극 활용
3. **반복 피하기**: 같은 톤이 지속되지 않도록 변화 추구
4. **자연스러운 호흡**: 적절한 break 태그로 숨쉬는 타이밍 제공

---

*마지막 업데이트: 2025년 1월 31일*
*AI Shorts Maker - 활기찬 음성 스타일 가이드*