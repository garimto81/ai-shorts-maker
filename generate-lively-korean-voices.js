// 신나고 통통 튀는 한국어 음성 샘플 생성
// 더 자연스러운 한국어 억양을 위한 최적화 버전

const fs = require('fs');
const path = require('path');

// 신나고 생동감 있는 샘플 텍스트
const LIVELY_SAMPLES = [
  {
    id: 1,
    name: "신나는_쇼핑_추천",
    text: "여러분! 오늘 정말 대박 아이템을 가져왔어요! 이거 진짜 놓치면 후회해요! 지금 바로 확인해보세요!",
    settings: {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli - 가장 활기찬 음성
      voice_settings: {
        stability: 0.4,          // 매우 낮춰서 톤 변화 극대화
        similarity_boost: 0.6,   // 낮춰서 더 자연스럽게
        style: 1.0,              // 최대로 올려서 감정 표현
        use_speaker_boost: true
      }
    },
    description: "쇼핑 라이브처럼 신나는 톤"
  },
  {
    id: 2,
    name: "유튜브_브이로그",
    text: "안녕하세요 여러분! 오늘은 정말 재미있는 하루였어요! 아침부터 이런 일이 있었는데요, 진짜 깜짝 놀랐어요!",
    settings: {
      voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - 젊고 발랄한 음성
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.65,
        style: 0.9,
        use_speaker_boost: true
      }
    },
    description: "젊고 발랄한 브이로거 스타일"
  },
  {
    id: 3,
    name: "게임_리뷰_흥분",
    text: "와! 이거 진짜 미쳤어요! 그래픽 보세요! 이런 게임은 처음이에요! 여러분도 꼭 해보세요! 강추!",
    settings: {
      voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - 젊은 남성
      voice_settings: {
        stability: 0.35,        // 매우 낮춰서 흥분된 톤
        similarity_boost: 0.6,
        style: 0.95,
        use_speaker_boost: true
      }
    },
    description: "흥분된 게임 리뷰어 스타일"
  },
  {
    id: 4,
    name: "뷰티_튜토리얼",
    text: "자! 이제 이 제품을 이렇게 톡톡 두드려서 발라주세요! 와! 정말 예쁘지 않나요? 여러분도 쉽게 따라할 수 있어요!",
    settings: {
      voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - 부드럽지만 활기찬
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.68,
        style: 0.85,
        use_speaker_boost: true
      }
    },
    description: "친근하고 활기찬 뷰티 크리에이터"
  },
  {
    id: 5,
    name: "먹방_리액션",
    text: "우와! 이 맛 진짜 장난 아니에요! 바삭바삭하고 고소하고! 여러분 이거 꼭 드셔보세요! 대박!",
    settings: {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
      voice_settings: {
        stability: 0.38,        // 더 낮춰서 감탄사 강조
        similarity_boost: 0.58,
        style: 0.98,
        use_speaker_boost: true
      }
    },
    description: "먹방 크리에이터의 리액션"
  }
];

// API 호출 함수
async function generateLivelyVoice(sample) {
  console.log(`\n🎤 샘플 ${sample.id}: ${sample.name}`);
  console.log(`📝 대사: "${sample.text}"`);
  console.log(`🎯 스타일: ${sample.description}`);
  console.log(`⚡ 설정: stability=${sample.settings.voice_settings.stability}, style=${sample.settings.voice_settings.style}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sample.text,
        voice_id: sample.settings.voice_id,
        voice_settings: sample.settings.voice_settings
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 생성 성공!');
      console.log(`   🔊 음성: ${sample.settings.voice_id}`);
      console.log(`   🎵 파일: http://localhost:3000${result.data.audioUrl}`);
      console.log(`   ⏱️  길이: ${result.data.duration}초`);
      
      // 결과 저장
      const resultDir = path.join(__dirname, 'lively-korean-voices');
      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true });
      }
      
      const infoFile = path.join(resultDir, `lively_${sample.id}_${sample.name}.json`);
      fs.writeFileSync(infoFile, JSON.stringify({
        ...sample,
        result: result.data,
        generated_at: new Date().toISOString(),
        listen_url: `http://localhost:3000${result.data.audioUrl}`
      }, null, 2), 'utf8');
      
      return true;
    } else {
      console.error('❌ 생성 실패:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return false;
  }
}

// 음성 비교를 위한 동일 텍스트 다른 설정 테스트
async function compareVoiceSettings() {
  console.log('\n🔬 음성 설정 비교 테스트');
  console.log('=' .repeat(60));
  
  const testText = "안녕하세요! 오늘은 정말 신나는 소식을 전해드릴게요! 여러분 준비되셨나요?";
  
  const compareSettings = [
    {
      name: "기본설정",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    },
    {
      name: "신나는설정",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.6,
        style: 0.95,
        use_speaker_boost: true
      }
    },
    {
      name: "초신나는설정",
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.5,
        style: 1.0,
        use_speaker_boost: true
      }
    }
  ];
  
  for (const setting of compareSettings) {
    console.log(`\n🎛️ ${setting.name} 테스트`);
    await generateLivelyVoice({
      id: `compare_${setting.name}`,
      name: setting.name,
      text: testText,
      settings: {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli로 통일
        voice_settings: setting.voice_settings
      },
      description: `설정 비교: ${setting.name}`
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 메인 실행
async function main() {
  console.log('🚀 신나고 통통 튀는 한국어 음성 생성');
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
  
  // 생동감 있는 샘플 생성
  console.log('📢 생동감 있는 음성 샘플 생성');
  console.log('-' .repeat(60));
  
  let successCount = 0;
  for (const sample of LIVELY_SAMPLES) {
    const success = await generateLivelyVoice(sample);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 설정 비교 테스트
  await compareVoiceSettings();
  
  // 결과 요약
  console.log('\n' + '=' .repeat(60));
  console.log('📊 생성 결과:');
  console.log(`   ✅ 생동감 샘플: ${successCount}/${LIVELY_SAMPLES.length}개 성공`);
  console.log(`   🔬 비교 테스트: 3개 생성`);
  
  console.log('\n💡 한국어 억양 개선 팁:');
  console.log('   1. stability를 0.3-0.5로 낮춰서 톤 변화 증가');
  console.log('   2. style을 0.9-1.0으로 높여서 감정 표현 극대화');
  console.log('   3. 문장을 짧게 끊고 느낌표 활용');
  console.log('   4. Elli(MF3mGyEYCl7XYWbV9V6O) 음성이 가장 활기참');
  
  console.log('\n🎧 생성된 음성을 들어보고 가장 자연스러운 설정을 선택하세요!');
}

// 실행
main().catch(console.error);