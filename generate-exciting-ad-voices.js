// 광고 영상용 신나고 활기찬 한국어 음성 생성
// 희소성과 긴급감을 전달하는 광고 전문 톤

const fs = require('fs');
const path = require('path');

// 광고용 활기찬 텍스트 샘플 5개
const EXCITING_AD_SAMPLES = [
  {
    id: 1,
    name: "한정판매_긴급",
    text: "지금 이 순간! 단 100개 한정! 놓치면 정말 후회해요! 3, 2, 1... 지금 바로 주문하세요!",
    voice_config: {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli - 가장 활기찬 여성
      settings: {
        stability: 0.35,        // 매우 낮춰서 극적인 톤 변화
        similarity_boost: 0.60, // 낮춰서 더 다이나믹하게
        style: 1.0,            // 최대로 올려서 감정 극대화
        use_speaker_boost: true
      }
    },
    preprocessing: {
      emphasis: true,
      exclamation: true,
      countdown: true
    }
  },
  {
    id: 2,
    name: "신제품_런칭",
    text: "드디어 공개합니다! 2025년 최고의 혁신! 여러분이 기다리던 바로 그 제품! 오늘만 특별 가격!",
    voice_config: {
      voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - 젊고 트렌디한 여성
      settings: {
        stability: 0.40,
        similarity_boost: 0.62,
        style: 0.95,
        use_speaker_boost: true
      }
    },
    preprocessing: {
      year_conversion: true,
      emphasis: true
    }
  },
  {
    id: 3,
    name: "타임세일_카운트다운",
    text: "타임세일 시작! 24시간 한정! 최대 70% 할인! 품절되기 전에 서두르세요! 기회는 단 한 번뿐!",
    voice_config: {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
      settings: {
        stability: 0.38,
        similarity_boost: 0.58,
        style: 1.0,
        use_speaker_boost: true
      }
    },
    preprocessing: {
      number_emphasis: true,
      urgency: true
    }
  },
  {
    id: 4,
    name: "VIP_특별혜택",
    text: "VIP 고객님만을 위한 특별한 기회! 평생 단 한 번! 이런 가격은 다시 없습니다! 놓치지 마세요!",
    voice_config: {
      voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel - 신뢰감 있으면서 활기찬
      settings: {
        stability: 0.42,
        similarity_boost: 0.65,
        style: 0.90,
        use_speaker_boost: true
      }
    },
    preprocessing: {
      vip_tone: true,
      exclusivity: true
    }
  },
  {
    id: 5,
    name: "마감임박_라스트찬스",
    text: "마감 임박! 재고 단 10개! 지금 아니면 영원히 없어요! 후회하기 전에 지금 클릭하세요!",
    voice_config: {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
      settings: {
        stability: 0.33,        // 가장 낮춰서 최대 긴급감
        similarity_boost: 0.55,
        style: 1.0,
        use_speaker_boost: true
      }
    },
    preprocessing: {
      final_urgency: true,
      scarcity: true
    }
  }
];

// 광고 특화 텍스트 전처리
function preprocessAdText(text, options = {}) {
  let processed = text;
  
  // 1. 숫자를 더 강조되게 변환
  if (options.number_emphasis) {
    processed = processed
      .replace(/100개/g, '백! 개!')
      .replace(/24시간/g, '이십사! 시간!')
      .replace(/70%/g, '칠십 퍼센트!')
      .replace(/10개/g, '열! 개!');
  }
  
  // 2. 연도 변환
  if (options.year_conversion) {
    processed = processed.replace(/2025년/g, '이천이십오년');
  }
  
  // 3. 강조 표현 추가
  if (options.emphasis) {
    processed = processed
      .replace(/!/g, '!!')  // 느낌표 강화
      .replace(/지금/g, '지금!') // 긴급 단어 강조
      .replace(/바로/g, '바로!');
  }
  
  // 4. 카운트다운 효과
  if (options.countdown) {
    processed = processed.replace(/3, 2, 1/g, '삼!.. 이!.. 일!..');
  }
  
  // 5. VIP 톤
  if (options.vip_tone) {
    processed = processed.replace(/VIP/g, '브이아이피');
  }
  
  // 6. 희소성 강조
  if (options.scarcity || options.final_urgency) {
    // 문장 사이에 더 짧은 쉼 추가 (급박함 표현)
    processed = processed.replace(/! /g, '!. ');
  }
  
  // 7. 자연스러운 리듬을 위한 쉼 추가
  processed = processed
    .replace(/\. /g, '.. ')   // 문장 끝 쉼
    .replace(/! /g, '! ')     // 느낌표 뒤 짧은 쉼
    .replace(/\?/g, '?. ');   // 물음표 뒤 쉼
  
  return processed;
}

// 음성 생성 함수
async function generateExcitingAdVoice(sample) {
  console.log(`\n🎯 광고 샘플 ${sample.id}: ${sample.name}`);
  console.log(`📝 원본: "${sample.text}"`);
  
  // 텍스트 전처리
  const processedText = preprocessAdText(sample.text, sample.preprocessing);
  console.log(`✨ 처리: "${processedText}"`);
  console.log(`🎙️ 음성: ${sample.voice_config.voice_id}`);
  console.log(`⚡ 설정: stability=${sample.voice_config.settings.stability}, style=${sample.voice_config.settings.style}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: processedText,
        voice_id: sample.voice_config.voice_id,
        model_id: 'eleven_multilingual_v2',
        voice_settings: sample.voice_config.settings
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 생성 성공!');
      console.log(`   🔊 파일: http://localhost:3000${result.data.audioUrl}`);
      console.log(`   ⏱️  길이: ${result.data.duration}초`);
      console.log(`   🎪 특징: ${getVoiceCharacteristic(sample.voice_config.settings)}`);
      
      // 결과 저장
      const resultDir = path.join(__dirname, 'exciting-ad-voices');
      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true });
      }
      
      const infoFile = path.join(resultDir, `ad_${sample.id}_${sample.name}.json`);
      fs.writeFileSync(infoFile, JSON.stringify({
        ...sample,
        processedText,
        result: result.data,
        generated_at: new Date().toISOString(),
        audio_url: `http://localhost:3000${result.data.audioUrl}`
      }, null, 2), 'utf8');
      
      return { success: true, url: result.data.audioUrl };
    } else {
      console.error('❌ 생성 실패:', result.error);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return { success: false };
  }
}

// 음성 특징 설명
function getVoiceCharacteristic(settings) {
  if (settings.stability < 0.35) {
    return "초긴급! 극도로 다이나믹한 톤";
  } else if (settings.stability < 0.4) {
    return "매우 활기차고 긴급한 톤";
  } else if (settings.stability < 0.45) {
    return "활기차고 생동감 있는 톤";
  } else {
    return "밝고 경쾌한 톤";
  }
}

// 추가 실험: 동일 텍스트로 다양한 감정 표현
async function experimentWithEmotions() {
  console.log('\n🧪 감정 표현 실험');
  console.log('=' .repeat(60));
  
  const testText = "와! 정말 놀라운 특가! 오늘만 가능해요! 서두르세요!";
  
  const emotionSettings = [
    {
      name: "극도_흥분",
      settings: { stability: 0.30, similarity_boost: 0.55, style: 1.0 }
    },
    {
      name: "활기찬_설득",
      settings: { stability: 0.38, similarity_boost: 0.60, style: 0.95 }
    },
    {
      name: "친근한_권유",
      settings: { stability: 0.45, similarity_boost: 0.65, style: 0.85 }
    }
  ];
  
  for (const emotion of emotionSettings) {
    console.log(`\n🎭 ${emotion.name} 테스트`);
    
    await generateExcitingAdVoice({
      id: `emotion_${emotion.name}`,
      name: emotion.name,
      text: testText,
      voice_config: {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli로 통일
        settings: { ...emotion.settings, use_speaker_boost: true }
      },
      preprocessing: { emphasis: true }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 메인 실행
async function main() {
  console.log('🚀 광고 전문 활기찬 한국어 음성 생성');
  console.log('🎯 목표: 신나고 활기차며 희소성을 전달하는 광고 톤');
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
  
  // 광고 샘플 생성
  console.log('📢 광고 전문 음성 샘플 생성');
  console.log('-' .repeat(60));
  
  const results = [];
  for (const sample of EXCITING_AD_SAMPLES) {
    const result = await generateExcitingAdVoice(sample);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 감정 표현 실험
  await experimentWithEmotions();
  
  // 결과 요약
  const successCount = results.filter(r => r.success).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 생성 결과:');
  console.log(`   ✅ 광고 샘플: ${successCount}/${EXCITING_AD_SAMPLES.length}개 성공`);
  console.log(`   🧪 감정 실험: 3개 생성`);
  
  console.log('\n💡 광고 음성 최적화 팁:');
  console.log('   1. Stability 0.33-0.40으로 설정 → 극적인 톤 변화');
  console.log('   2. Style 0.95-1.0으로 최대화 → 감정 표현 극대화');
  console.log('   3. Elli(MF3mGyEYCl7XYWbV9V6O) 음성이 광고에 최적');
  console.log('   4. 느낌표 중복(!!)과 숫자 강조로 긴급감 표현');
  console.log('   5. 짧은 문장과 빠른 리듬으로 주의 집중');
  
  console.log('\n🎧 생성된 광고 음성을 들어보세요!');
  console.log('희소성과 긴급감이 느껴지는 활기찬 광고 톤을 확인할 수 있습니다.');
}

// 실행
main().catch(console.error);