import React, { useState, useEffect } from 'react';
import Head from 'next/head';

type EnergeticEmotion = 'excited' | 'motivated' | 'enthusiastic' | 'cheerful' | 'celebratory';

export default function TestVoice() {
  const [text, setText] = useState("안녕하세요! 오늘은 정말 좋은 날이에요! 여러분과 함께할 수 있어서 기뻐요!");
  const [emotion, setEmotion] = useState<EnergeticEmotion>('excited');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [videoType, setVideoType] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 목소리 목록 불러오기
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices');
      const result = await response.json();
      if (result.success) {
        setVoices(result.data.voices);
      }
    } catch (err) {
      console.error('목소리 목록 불러오기 실패:', err);
    }
  };

  const handleEmotionClick = (newEmotion: EnergeticEmotion) => {
    setEmotion(newEmotion);
  };

  const applyPreset = (type: string) => {
    const presets: Record<string, any> = {
      '광고': {
        text: '지금 바로 만나보세요! 놓치면 후회하는 특별한 기회! 이번 주말까지 특별 할인!',
        videoType: 'advertisement',
        emotion: 'enthusiastic',
        intensity: 'high'
      },
      '동기부여': {
        text: '할 수 있습니다! 당신의 꿈을 향해 달려가세요! 포기하지 마세요! 파이팅!',
        videoType: 'motivation',
        emotion: 'motivated',
        intensity: 'high',
        gender: 'male'
      },
      '축하': {
        text: '축하드려요! 정말 대단한 성과를 이루셨네요! 너무너무 기뻐요!',
        videoType: 'celebration',
        emotion: 'celebratory',
        intensity: 'medium',
        gender: 'female'
      },
      '튜토리얼': {
        text: '자, 이제 함께 배워볼까요? 아주 쉽고 재미있어요! 차근차근 따라해보세요!',
        videoType: 'tutorial',
        emotion: 'cheerful',
        intensity: 'medium'
      }
    };

    const preset = presets[type];
    if (preset) {
      setText(preset.text);
      setVideoType(preset.videoType || '');
      setEmotion(preset.emotion || 'excited');
      setIntensity(preset.intensity || 'medium');
      setGender(preset.gender || '');
    }
  };

  const generateVoice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const data: any = {
      text,
      emotion,
      intensity
    };

    if (gender) data.gender = gender;
    if (videoType) data.videoType = videoType;
    if (voiceId) data.voiceId = voiceId;

    try {
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setResult(result.data);
      } else {
        setError(result.error || '음성 생성 실패');
      }
    } catch (err: any) {
      setError('서버 연결 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>활기찬 음성 생성 테스트</title>
      </Head>
      
      <div className="container">
        <h1>🎉 활기찬 한국어 음성 생성 테스트</h1>
        
        <div className="info-box">
          <h4>ℹ️ 테스트 환경 안내</h4>
          <p>1. 서버가 실행 중이어야 합니다: <code>npm run dev</code></p>
          <p>2. ElevenLabs API 키가 설정되어 있어야 합니다</p>
          <p>3. 생성된 음성은 아래에서 바로 재생할 수 있습니다</p>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="text">텍스트 입력 (필수)</label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="변환할 텍스트를 입력하세요..."
            />
          </div>

          <div className="form-group">
            <label>감정 선택</label>
            <div className="emotion-buttons">
              <button
                className={`emotion-btn ${emotion === 'excited' ? 'active' : ''}`}
                onClick={() => handleEmotionClick('excited')}
              >
                😊 신남 (Excited)
              </button>
              <button
                className={`emotion-btn ${emotion === 'motivated' ? 'active' : ''}`}
                onClick={() => handleEmotionClick('motivated')}
              >
                💪 동기부여 (Motivated)
              </button>
              <button
                className={`emotion-btn ${emotion === 'enthusiastic' ? 'active' : ''}`}
                onClick={() => handleEmotionClick('enthusiastic')}
              >
                🎯 열정적 (Enthusiastic)
              </button>
              <button
                className={`emotion-btn ${emotion === 'cheerful' ? 'active' : ''}`}
                onClick={() => handleEmotionClick('cheerful')}
              >
                😄 명랑함 (Cheerful)
              </button>
              <button
                className={`emotion-btn ${emotion === 'celebratory' ? 'active' : ''}`}
                onClick={() => handleEmotionClick('celebratory')}
              >
                🎊 축하 (Celebratory)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="voiceSelect">목소리 선택</label>
            <select
              id="voiceSelect"
              value={voiceId}
              onChange={(e) => {
                setVoiceId(e.target.value);
                // 선택한 목소리의 성별도 자동으로 설정
                const selectedVoice = voices.find(v => v.id === e.target.value);
                if (selectedVoice) {
                  setGender(selectedVoice.gender);
                }
              }}
            >
              <option value="">자동 선택 (감정에 맞는 추천)</option>
              <optgroup label="여성 목소리">
                {voices.filter(v => v.gender === 'female').map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="남성 목소리">
                {voices.filter(v => v.gender === 'male').map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="gender">성별 필터 (자동 선택 시)</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              disabled={!!voiceId}
            >
              <option value="">성별 무관</option>
              <option value="male">남성만</option>
              <option value="female">여성만</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="intensity">강도</label>
            <select
              id="intensity"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as any)}
            >
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="videoType">비디오 타입 (선택)</label>
            <select
              id="videoType"
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
            >
              <option value="">직접 설정</option>
              <option value="advertisement">광고</option>
              <option value="tutorial">튜토리얼</option>
              <option value="motivation">동기부여</option>
              <option value="celebration">축하</option>
            </select>
          </div>

          <button
            className="generate-btn"
            onClick={generateVoice}
            disabled={loading || !text}
          >
            {loading ? '⏳ 생성 중...' : '🎤 음성 생성하기'}
          </button>
        </div>

        <div className="presets">
          <h4>🎯 빠른 테스트 프리셋</h4>
          <div className="preset-item" onClick={() => applyPreset('광고')}>
            📢 <strong>광고</strong> - "지금 바로 만나보세요! 놓치면 후회하는 특별한 기회!"
          </div>
          <div className="preset-item" onClick={() => applyPreset('동기부여')}>
            💪 <strong>동기부여</strong> - "할 수 있습니다! 당신의 꿈을 향해 달려가세요!"
          </div>
          <div className="preset-item" onClick={() => applyPreset('축하')}>
            🎉 <strong>축하</strong> - "축하드려요! 정말 대단한 성과를 이루셨네요!"
          </div>
          <div className="preset-item" onClick={() => applyPreset('튜토리얼')}>
            📚 <strong>튜토리얼</strong> - "자, 이제 함께 배워볼까요? 아주 쉽고 재미있어요!"
          </div>
        </div>

        {result && (
          <div className="result">
            <h3>생성 결과</h3>
            <div className="success">✅ 음성 생성 성공!</div>
            <p><strong>사용된 음성:</strong> {result.voiceUsed}</p>
            <p><strong>감정:</strong> {result.emotion}</p>
            <p><strong>강도:</strong> {result.intensity}</p>
            <p><strong>길이:</strong> {result.duration}초</p>
            {voiceId && <p><strong>선택 방식:</strong> 직접 선택한 목소리</p>}
            {!voiceId && <p><strong>선택 방식:</strong> 자동 선택 (감정과 성별 기반)</p>}
            <audio controls autoPlay src={result.audioUrl}>
              브라우저가 오디오 재생을 지원하지 않습니다.
            </audio>
          </div>
        )}

        {error && (
          <div className="error">
            ❌ 오류: {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }

        .info-box {
          background-color: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 4px solid #2196F3;
        }

        .info-box h4 {
          margin-top: 0;
          color: #1976D2;
        }

        .info-box p {
          margin: 5px 0;
        }

        .info-box code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .form-section {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
          color: #555;
        }

        input, select, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }

        select:disabled {
          background-color: #f0f0f0;
          cursor: not-allowed;
          opacity: 0.7;
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .emotion-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .emotion-btn {
          padding: 8px 16px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .emotion-btn.active {
          background-color: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }

        .generate-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 5px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .generate-btn:hover:not(:disabled) {
          background-color: #45a049;
        }

        .generate-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .presets {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .presets h4 {
          margin-top: 0;
          color: #666;
        }

        .preset-item {
          padding: 10px;
          margin: 5px 0;
          background: #f0f0f0;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .preset-item:hover {
          background-color: #e3f2fd;
          transform: translateX(5px);
        }

        .result {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-top: 20px;
        }

        .result h3 {
          margin-top: 0;
          color: #333;
        }

        audio {
          width: 100%;
          margin-top: 10px;
        }

        .success {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }

        .error {
          background: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
        }
      `}</style>
    </>
  );
}