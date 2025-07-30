// ElevenLabs 음성 샘플 생성 스크립트
// 5가지 다양한 스타일의 한국어 음성 생성

const fs = require('fs');
const path = require('path');

// 5가지 샘플 텍스트 (다양한 상황)
const VOICE_SAMPLES = [
  {
    id: 1,
    name: "자동차정비_전문가",
    text: "안녕하세요. 오늘은 BMW 520d의 엔진오일 교환 방법을 알려드리겠습니다. 먼저 차량을 평평한 곳에 주차하고 엔진을 충분히 식혀주세요.",
    video_type: "auto_repair",
    description: "전문적이고 신뢰감 있는 남성 목소리 (Adam)"
  },
  {
    id: 2,
    name: "친근한_튜토리얼",
    text: "여러분 안녕하세요! 오늘은 정말 쉽고 재미있는 DIY 프로젝트를 준비했어요. 집에서 누구나 따라할 수 있으니 천천히 함께 해봐요.",
    video_type: "tutorial",
    description: "친근하고 따뜻한 여성 목소리 (Rachel)"
  },
  {
    id: 3,
    name: "신나는_광고",
    text: "지금 바로 만나보세요! 2025년 최신 기술이 적용된 혁신적인 제품! 놓치면 후회하는 특별한 기회, 오늘만 50% 할인!",
    video_type: "advertisement",
    description: "활기차고 열정적인 여성 목소리 (Elli)"
  },
  {
    id: 4,
    name: "차분한_나레이션",
    text: "깊은 밤, 도시의 불빛이 하나둘 꺼져갑니다. 고요한 적막 속에서 새로운 이야기가 시작되려 하고 있습니다. 이것은 우리 모두의 이야기입니다.",
    video_type: "narration",
    description: "차분하고 안정적인 나레이터 목소리 (Bill)"
  },
  {
    id: 5,
    name: "교육용_설명",
    text: "오늘 배울 내용은 인공지능의 기본 원리입니다. 먼저 머신러닝이 무엇인지 이해하고, 실제로 어떻게 활용되는지 단계별로 살펴보겠습니다.",
    video_type: "educational",
    description: "명확하고 이해하기 쉬운 여성 목소리 (Rachel)"
  }
];

// API 호출 함수
async function generateVoiceSample(sample) {
  console.log(`\n🎙️ 샘플 ${sample.id}: ${sample.name}`);
  console.log(`📝 텍스트: "${sample.text.substring(0, 50)}..."`);
  console.log(`🎯 타입: ${sample.video_type}`);
  console.log(`🔊 예상 음성: ${sample.description}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sample.text,
        video_type: sample.video_type
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 음성 생성 성공!');
      console.log(`   - 오디오 URL: ${result.data.audioUrl}`);
      console.log(`   - 길이: ${result.data.duration}초`);
      console.log(`   - 음성: ${result.data.voice_id}`);
      console.log(`   - 파일: http://localhost:3000${result.data.audioUrl}`);
      
      // 결과 저장
      const resultDir = path.join(__dirname, 'voice-samples');
      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true });
      }
      
      // 샘플 정보 저장
      const infoFile = path.join(resultDir, `sample_${sample.id}_${sample.name}.json`);
      fs.writeFileSync(infoFile, JSON.stringify({
        ...sample,
        result: result.data,
        generated_at: new Date().toISOString(),
        audio_url: `http://localhost:3000${result.data.audioUrl}`
      }, null, 2), 'utf8');
      
      console.log(`   - 정보 저장: ${infoFile}`);
      
      return true;
    } else {
      console.error('❌ 음성 생성 실패:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return false;
  }
}

// 사용량 확인 함수
async function checkUsage() {
  try {
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "사용량 확인",
        video_type: "narration"
      })
    });

    const result = await response.json();
    
    if (result.success && result.metadata?.usage) {
      const usage = result.metadata.usage;
      console.log('\n📊 ElevenLabs 사용량:');
      console.log(`   - 사용: ${usage.used}자`);
      console.log(`   - 한도: ${usage.limit}자`);
      console.log(`   - 남음: ${usage.remaining}자`);
      console.log(`   - 사용률: ${((usage.used / usage.limit) * 100).toFixed(1)}%`);
      return usage;
    }
    return null;
  } catch (error) {
    console.error('사용량 확인 실패:', error.message);
    return null;
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 ElevenLabs 한국어 음성 샘플 생성 시작');
  console.log('=' .repeat(60));
  
  // 서버 확인
  try {
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', { method: 'GET' });
    if (response.status === 405) {
      console.log('✅ API 서버 정상 작동 중\n');
    }
  } catch (error) {
    console.error('❌ 서버가 실행 중이 아닙니다. npm run dev로 서버를 시작하세요.');
    return;
  }
  
  // 초기 사용량 확인
  const initialUsage = await checkUsage();
  
  // 각 샘플 생성
  let successCount = 0;
  for (const sample of VOICE_SAMPLES) {
    const success = await generateVoiceSample(sample);
    if (success) {
      successCount++;
      // API 제한 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // 결과 요약
  console.log('\n' + '=' .repeat(60));
  console.log('📊 생성 결과 요약:');
  console.log(`   - 전체: ${VOICE_SAMPLES.length}개`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${VOICE_SAMPLES.length - successCount}개`);
  
  // 최종 사용량 확인
  const finalUsage = await checkUsage();
  if (initialUsage && finalUsage) {
    const used = finalUsage.used - initialUsage.used;
    console.log(`\n💰 이번 세션 사용량: ${used}자`);
  }
  
  // 생성된 파일 목록
  const resultDir = path.join(__dirname, 'voice-samples');
  if (fs.existsSync(resultDir)) {
    const files = fs.readdirSync(resultDir);
    console.log('\n📁 생성된 파일:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log('\n✨ 음성 샘플 생성 완료!');
  console.log('브라우저에서 각 오디오 URL을 열어 음성을 확인하세요.');
  console.log('\n💡 팁: 고주파 소리가 아닌 자연스러운 한국어 음성이 들려야 정상입니다!');
}

// 실행
main().catch(console.error);