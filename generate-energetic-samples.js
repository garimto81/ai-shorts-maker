// 밝고 활기찬 에너지 넘치는 음성 샘플 생성
// 남녀 음성 무작위 선택

const fs = require('fs');
const path = require('path');

// 활기찬 텍스트 샘플 5개
const ENERGETIC_SAMPLES = [
  {
    id: 1,
    name: "신나는_아침인사",
    text: "좋은 아침이에요! 오늘도 활기차게 시작해볼까요? 정말 멋진 하루가 될 거예요!",
    gender: "female",
    voice_id: "MF3mGyEYCl7XYWbV9V6O", // Elli - 가장 활기찬 여성
    voice_name: "Elli (활기찬 여성)",
    emotion: "excited"
  },
  {
    id: 2,
    name: "운동_동기부여",
    text: "자! 이제 시작해봅시다! 할 수 있어요! 우리 함께 목표를 향해 달려가요! 파이팅!",
    gender: "male",
    voice_id: "TxGEqnHWrfWFTfGW9XjX", // Josh - 젊고 활기찬 남성
    voice_name: "Josh (활기찬 남성)",
    emotion: "motivated"
  },
  {
    id: 3,
    name: "신제품_소개",
    text: "와! 드디어 공개합니다! 여러분이 기다리던 바로 그 제품! 정말 놀라운 기능들이 가득해요!",
    gender: "female",
    voice_id: "AZnzlk1XvdvUeBnXmlld", // Domi - 젊고 발랄한 여성
    voice_name: "Domi (발랄한 여성)",
    emotion: "enthusiastic"
  },
  {
    id: 4,
    name: "주말_나들이",
    text: "이번 주말엔 뭐하실 거예요? 날씨도 좋고 정말 나가기 딱 좋은 날이에요! 같이 즐거운 시간 보내요!",
    gender: "male",
    voice_id: "pNInz6obpgDQGcFmaJgB", // Adam - 친근하고 밝은 남성
    voice_name: "Adam (친근한 남성)",
    emotion: "cheerful"
  },
  {
    id: 5,
    name: "성공_축하",
    text: "축하드려요! 정말 대단해요! 그동안의 노력이 빛을 발하는 순간이네요! 너무너무 기뻐요!",
    gender: "female",
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - 따뜻하고 밝은 여성
    voice_name: "Rachel (따뜻한 여성)",
    emotion: "celebratory"
  }
];

// 활기찬 음성을 위한 SSML 처리
function processEnergeticText(text, emotion) {
  let processedText = text;
  
  // 1. 느낌표 강조
  processedText = processedText.replace(/!/g, '!<break time="100ms"/>');
  
  // 2. 감정 단어 강조
  processedText = processedText
    .replace(/정말/g, '<emphasis level="strong">정말</emphasis>')
    .replace(/너무/g, '<emphasis level="strong">너무</emphasis>')
    .replace(/와!/g, '<prosody pitch="+15%" rate="110%">와!</prosody>')
    .replace(/대단해요/g, '<emphasis level="strong">대단해요</emphasis>')
    .replace(/파이팅/g, '<prosody pitch="+20%" rate="120%">파이팅</prosody>');
  
  // 3. 의문문 활기차게
  processedText = processedText.replace(/요\?/g, '<prosody pitch="+15%">요?</prosody>');
  
  // 4. 전체를 밝은 톤으로 감싸기
  let ssml = '<speak>';
  
  // 감정별 프로소디 설정
  switch(emotion) {
    case 'excited':
      ssml += '<prosody rate="108%" pitch="+8%">';
      break;
    case 'motivated':
      ssml += '<prosody rate="110%" pitch="+10%" volume="loud">';
      break;
    case 'enthusiastic':
      ssml += '<prosody rate="112%" pitch="+12%">';
      break;
    case 'cheerful':
      ssml += '<prosody rate="105%" pitch="+7%">';
      break;
    case 'celebratory':
      ssml += '<prosody rate="110%" pitch="+10%">';
      break;
    default:
      ssml += '<prosody rate="108%" pitch="+8%">';
  }
  
  ssml += processedText;
  ssml += '</prosody></speak>';
  
  return ssml;
}

// 음성 생성 함수
async function generateEnergeticVoice(sample) {
  console.log(`\n🎉 샘플 ${sample.id}: ${sample.name}`);
  console.log(`👤 성별: ${sample.gender === 'male' ? '남성' : '여성'}`);
  console.log(`🎙️ 음성: ${sample.voice_name}`);
  console.log(`📝 텍스트: "${sample.text}"`);
  console.log(`😊 감정: ${sample.emotion}`);
  
  // 활기찬 SSML 처리
  const processedText = processEnergeticText(sample.text, sample.emotion);
  console.log(`✨ 처리됨: SSML 적용 (rate↑ pitch↑ emphasis)}`);
  
  // 활기찬 음성을 위한 최적 설정
  const voiceSettings = {
    stability: 0.42,        // 약간 낮춰서 더 다이나믹하게
    similarity_boost: 0.63, // 자연스러움 유지
    style: 0,              // 안정성
    use_speaker_boost: true
  };
  
  try {
    const requestBody = {
      text: processedText,
      model_id: "eleven_multilingual_v2",
      voice_id: sample.voice_id,
      voice_settings: voiceSettings,
      enable_ssml_parsing: true
    };
    
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 생성 성공!');
      console.log(`   🎵 URL: http://localhost:3000${result.data.audioUrl}`);
      console.log(`   ⏱️  길이: ${result.data.duration}초`);
      console.log(`   🎪 특징: 밝고 활기찬 ${sample.gender === 'male' ? '남성' : '여성'} 음성`);
      
      // 결과 저장
      const resultDir = path.join(__dirname, 'energetic-samples');
      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true });
      }
      
      const infoFile = path.join(resultDir, `energetic_${sample.id}_${sample.name}.json`);
      fs.writeFileSync(infoFile, JSON.stringify({
        ...sample,
        processedText,
        voiceSettings,
        result: result.data,
        generated_at: new Date().toISOString(),
        audio_url: `http://localhost:3000${result.data.audioUrl}`
      }, null, 2), 'utf8');
      
      return {
        success: true,
        url: `http://localhost:3000${result.data.audioUrl}`,
        duration: result.data.duration
      };
    } else {
      console.error('❌ 생성 실패:', result.error);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return { success: false };
  }
}

// 메인 실행
async function main() {
  console.log('🚀 밝고 활기찬 에너지 넘치는 음성 샘플 생성');
  console.log('🎯 남녀 음성 무작위 선택 (여성 3명, 남성 2명)');
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
  
  // 활기찬 샘플 생성
  console.log('🎉 활기찬 음성 샘플 생성 시작');
  console.log('-' .repeat(60));
  
  const results = [];
  for (const sample of ENERGETIC_SAMPLES) {
    const result = await generateEnergeticVoice(sample);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 결과 요약
  const successCount = results.filter(r => r.success).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 생성 결과:');
  console.log(`   ✅ 성공: ${successCount}/5개`);
  console.log(`   👥 성별: 여성 3명, 남성 2명`);
  
  console.log('\n🎧 생성된 음성 목록:');
  ENERGETIC_SAMPLES.forEach((sample, index) => {
    if (results[index].success) {
      console.log(`   ${sample.id}. [${sample.gender === 'male' ? '남' : '여'}] ${sample.name}`);
      console.log(`      🔗 ${results[index].url}`);
    }
  });
  
  console.log('\n💡 활기찬 음성 특징:');
  console.log('   1. 🎵 말하기 속도 105-112% (빠르게)');
  console.log('   2. 📈 음높이 +7~+12% (높게)');
  console.log('   3. 💪 강조 단어에 <emphasis> 태그');
  console.log('   4. ⚡ Stability 0.42로 다이나믹한 변화');
  console.log('   5. 🎉 느낌표 뒤 짧은 쉼으로 리듬감');
  
  console.log('\n🌟 모든 샘플이 밝고 활기차고 에너지 넘치는 톤입니다!');
}

// 실행
main().catch(console.error);