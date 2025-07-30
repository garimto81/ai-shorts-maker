import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface ScriptData {
  title: string;
  totalDuration: number;
  scenes: any[];
  narration: {
    fullText: string;
    segments: any[];
  };
  audio?: {
    audioUrl: string;
    duration: number;
    voiceUsed: string;
  };
}

interface VideoData {
  videoUrl: string;
  resolution: string;
  duration: number;
  fileSize: number;
}

const sampleScripts = {
  product: {
    title: "혁신적인 AI 스마트워치 출시!",
    content: "드디어 공개합니다! 당신의 일상을 바꿀 AI 스마트워치! 건강 관리부터 일정 관리까지, 모든 것을 한 번에! 놓치면 후회하는 특별 할인 이벤트! 지금 바로 만나보세요!"
  },
  tutorial: {
    title: "5분만에 배우는 영상 편집",
    content: "안녕하세요! 오늘은 누구나 쉽게 따라할 수 있는 영상 편집을 배워볼까요? 정말 간단해요! 차근차근 따라해보세요. 여러분도 멋진 영상을 만들 수 있어요!"
  },
  event: {
    title: "2024 연말 대축제",
    content: "올해를 마무리하는 특별한 축제에 여러분을 초대합니다! 놀라운 공연과 푸짐한 경품이 기다리고 있어요! 12월 31일, 우리 모두 함께 축하해요!"
  }
};

export default function TestIntegration() {
  const [scriptTitle, setScriptTitle] = useState("AI가 만드는 놀라운 쇼츠 영상");
  const [scriptContent, setScriptContent] = useState("안녕하세요! 오늘은 AI로 만든 놀라운 쇼츠 영상을 소개합니다. 정말 신기하고 재미있는 기술이에요! 여러분도 쉽게 만들 수 있답니다. 지금 바로 시작해보세요!");
  const [videoStyle, setVideoStyle] = useState("promotional");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [currentScript, setCurrentScript] = useState<ScriptData | null>(null);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSatisfaction, setAudioSatisfaction] = useState("perfect");
  const [testImages, setTestImages] = useState("nature");
  const [videoQuality, setVideoQuality] = useState("medium");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{time: string, type: string, message: string}>>([]);

  // 목소리 목록 불러오기
  useEffect(() => {
    fetchVoices();
  }, []);

  // 로그 추가 함수
  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    const time = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, { time, type, message }].slice(-50)); // 최대 50개 로그 유지
  };

  const fetchVoices = async () => {
    try {
      addLog('info', '목소리 목록 불러오는 중...');
      const response = await fetch('/api/tts/voices');
      const result = await response.json();
      if (result.success) {
        setVoices(result.data.voices);
        addLog('success', `${result.data.voices.length}개의 목소리 로드 완료`);
      } else {
        addLog('error', '목소리 목록 불러오기 실패: ' + result.error);
      }
    } catch (err: any) {
      console.error('목소리 목록 불러오기 실패:', err);
      addLog('error', '목소리 목록 불러오기 오류: ' + err.message);
    }
  };

  const loadSample = (type: keyof typeof sampleScripts) => {
    const sample = sampleScripts[type];
    setScriptTitle(sample.title);
    setScriptContent(sample.content);
    
    if (type === 'product') {
      setVideoStyle('promotional');
    } else if (type === 'tutorial') {
      setVideoStyle('educational');
    } else if (type === 'event') {
      setVideoStyle('entertainment');
    }
  };

  const generateScript = async () => {
    if (!scriptTitle || !scriptContent) {
      alert('제목과 내용을 입력해주세요!');
      addLog('warning', '제목과 내용이 필요합니다');
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog('info', '스크립트 생성 시작...');
    
    try {
      const requestData = {
        baseScript: {
          id: 'custom_' + Date.now(),
          title: scriptTitle,
          description: '사용자 정의 스크립트',
          category: videoStyle,
          tags: [videoStyle],
          content: {
            narration: scriptContent,
            scenes: []
          }
        },
        narrationSpeed: 'normal',
        videoStyle: videoStyle,
        generateAudio: generateAudio,
        voiceStyle: 'energetic',
        voiceId: voiceId
      };
      
      addLog('info', `요청 데이터: ${JSON.stringify(requestData).substring(0, 100)}...`);
      
      const response = await fetch('/api/scripts/generate-video-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      addLog('info', `응답 상태: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentScript(result.data);
        addLog('success', '스크립트 생성 완료!');
        
        if (result.data.audio) {
          setCurrentAudio(result.data.audio);
          addLog('success', `음성 생성 완료: ${result.data.audio.voiceUsed}`);
        } else if (generateAudio) {
          addLog('warning', '음성이 생성되지 않았습니다');
        }
      } else {
        throw new Error(result.error || '스크립트 생성 실패');
      }
    } catch (err: any) {
      const errorMsg = err.message || '알 수 없는 오류';
      setError(errorMsg);
      addLog('error', `스크립트 생성 오류: ${errorMsg}`);
      console.error('Script generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAudio = async () => {
    if (!currentScript) return;
    
    setLoading(true);
    setError(null);
    addLog('info', '음성 재생성 시작...');
    
    try {
      const emotions = ['excited', 'motivated', 'enthusiastic', 'cheerful', 'celebratory'];
      const newEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      
      addLog('info', `새로운 설정: ${newEmotion} 감정, ${gender} 음성`);
      
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: currentScript.narration.fullText,
          emotion: newEmotion,
          intensity: 'high',
          gender: gender
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentAudio(result.data);
        addLog('success', `음성 재생성 완료: ${result.data.voiceUsed}`);
      } else {
        throw new Error(result.error || '음성 재생성 실패');
      }
    } catch (err: any) {
      const errorMsg = err.message || '알 수 없는 오류';
      setError(errorMsg);
      addLog('error', `음성 재생성 오류: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!currentScript) {
      alert('먼저 스크립트를 생성해주세요!');
      addLog('warning', '스크립트가 없습니다. 먼저 생성해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(0);
    addLog('info', '비디오 렌더링 시작...');
    
    const imageMap: Record<string, string[]> = {
      'nature': ['/test-images/nature1.svg', '/test-images/nature2.svg', '/test-images/nature3.svg', '/test-images/nature4.svg', '/test-images/nature5.svg'],
      'tech': ['/test-images/tech1.svg', '/test-images/tech2.svg', '/test-images/tech3.svg', '/test-images/tech4.svg', '/test-images/tech5.svg'],
      'food': ['/test-images/food1.svg', '/test-images/food2.svg', '/test-images/food3.svg', '/test-images/food4.svg', '/test-images/food5.svg'],
      'abstract': ['/test-images/abstract1.svg', '/test-images/abstract2.svg', '/test-images/abstract3.svg', '/test-images/abstract4.svg', '/test-images/abstract5.svg']
    };
    
    const images = imageMap[testImages] || imageMap['nature'];
    
    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15;
        return next > 90 ? 90 : next;
      });
    }, 500);
    
    try {
      addLog('info', `선택된 이미지 세트: ${testImages}`);
      addLog('info', `비디오 품질: ${videoQuality}`);
      
      const response = await fetch('/api/videos/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: images,
          audioUrl: currentAudio?.audioUrl,
          videoScript: currentScript,
          outputFormat: 'mp4',
          quality: videoQuality,
          resolution: videoQuality === 'high' ? '1080x1920' : videoQuality === 'medium' ? '720x1280' : '540x960',
          frameRate: 30,
          projectTitle: currentScript.title
        })
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      addLog('info', `응답 상태: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentVideo(result.data);
        addLog('success', '비디오 생성 완료!');
        addLog('info', `비디오 크기: ${Math.round(result.data.fileSize / 1024 / 1024)}MB`);
      } else {
        throw new Error(result.error || '비디오 생성 실패');
      }
    } catch (err: any) {
      const errorMsg = err.message || '알 수 없는 오류';
      setError(errorMsg);
      addLog('error', `비디오 생성 오류: ${errorMsg}`);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadVideo = () => {
    if (currentVideo && currentVideo.videoUrl) {
      const a = document.createElement('a');
      a.href = currentVideo.videoUrl;
      a.download = currentScript?.title + '.mp4' || 'video.mp4';
      a.click();
    }
  };

  const resetAll = () => {
    setCurrentScript(null);
    setCurrentAudio(null);
    setCurrentVideo(null);
    setScriptTitle('');
    setScriptContent('');
    setError(null);
  };

  return (
    <>
      <Head>
        <title>AI Shorts Maker - 전체 통합 테스트</title>
      </Head>
      
      <div className="container">
        <h1 className="main-title">🎬 AI Shorts Maker - 전체 통합 테스트</h1>
        
        <div className="workflow">
          {/* Step 1: 스크립트 생성 */}
          <div className="step">
            <h2>
              <span className="step-number">1</span>
              스크립트 생성
            </h2>
            
            <div className="form-group">
              <label htmlFor="scriptTitle">제목</label>
              <input
                type="text"
                id="scriptTitle"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="scriptContent">내용</label>
              <textarea
                id="scriptContent"
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="videoStyle">비디오 스타일</label>
              <select
                id="videoStyle"
                value={videoStyle}
                onChange={(e) => setVideoStyle(e.target.value)}
              >
                <option value="promotional">홍보 (활기찬)</option>
                <option value="educational">교육 (친근한)</option>
                <option value="entertainment">엔터테인먼트 (신나는)</option>
                <option value="documentary">다큐멘터리 (차분한)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={generateAudio}
                  onChange={(e) => setGenerateAudio(e.target.checked)}
                />
                활기찬 음성 자동 생성
              </label>
            </div>
            
            {generateAudio && (
              <div className="form-group">
                <label htmlFor="voiceSelect">목소리 선택 (선택사항)</label>
                <select
                  id="voiceSelect"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  <option value="">자동 선택 (비디오 스타일에 맞게)</option>
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
            )}
            
            <button onClick={generateScript} disabled={loading}>
              {loading ? '생성 중...' : '스크립트 생성'}
            </button>
            
            <div className="test-samples">
              <h4>테스트 샘플:</h4>
              <button className="sample-button" onClick={() => loadSample('product')}>신제품 소개</button>
              <button className="sample-button" onClick={() => loadSample('tutorial')}>튜토리얼</button>
              <button className="sample-button" onClick={() => loadSample('event')}>이벤트 홍보</button>
            </div>
            
            {currentScript && (
              <div className="result-box">
                <div className="success">✅ 스크립트 생성 완료!</div>
                <p><strong>제목:</strong> {currentScript.title}</p>
                <p><strong>길이:</strong> {currentScript.totalDuration}초</p>
                <p><strong>장면 수:</strong> {currentScript.scenes.length}개</p>
              </div>
            )}
          </div>
          
          {/* Step 2: 음성 확인 */}
          <div className="step">
            <h2>
              <span className="step-number">2</span>
              음성 확인
            </h2>
            
            {currentAudio && (
              <div>
                <p><strong>생성된 음성:</strong></p>
                <p>{currentAudio.voiceUsed} ({currentAudio.duration}초)</p>
                <audio controls src={currentAudio.audioUrl} />
                
                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>음성 만족도</label>
                  <select
                    value={audioSatisfaction}
                    onChange={(e) => setAudioSatisfaction(e.target.value)}
                  >
                    <option value="perfect">완벽해요! 🎉</option>
                    <option value="good">좋아요 👍</option>
                    <option value="regenerate">다시 생성할게요 🔄</option>
                  </select>
                </div>
                
                {audioSatisfaction === 'regenerate' && (
                  <button onClick={regenerateAudio} disabled={loading}>
                    다른 스타일로 재생성
                  </button>
                )}
              </div>
            )}
            
            {loading && !currentAudio && (
              <div className="loading">음성을 생성하고 있습니다...</div>
            )}
          </div>
          
          {/* Step 3: 비디오 생성 */}
          <div className="step">
            <h2>
              <span className="step-number">3</span>
              비디오 생성
            </h2>
            
            <div className="form-group">
              <label htmlFor="testImages">테스트 이미지 선택</label>
              <select
                id="testImages"
                value={testImages}
                onChange={(e) => setTestImages(e.target.value)}
              >
                <option value="nature">자연 풍경 (5장)</option>
                <option value="tech">기술/IT (5장)</option>
                <option value="food">음식 (5장)</option>
                <option value="abstract">추상적 이미지 (5장)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="videoQuality">비디오 품질</label>
              <select
                id="videoQuality"
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
              >
                <option value="high">고품질 (1080p)</option>
                <option value="medium">중간 (720p)</option>
                <option value="low">저품질 (540p)</option>
              </select>
            </div>
            
            <button onClick={generateVideo} disabled={!currentScript || loading}>
              비디오 생성
            </button>
            
            {progress > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
            
            {currentVideo && (
              <div>
                <video controls src={currentVideo.videoUrl} />
                <div className="success">✅ 비디오 생성 완료!</div>
                <p><strong>해상도:</strong> {currentVideo.resolution}</p>
                <p><strong>길이:</strong> {currentVideo.duration}초</p>
                <p><strong>크기:</strong> {Math.round(currentVideo.fileSize / 1024 / 1024)}MB</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 전체 상태 표시 */}
        <div className="step full-width">
          <h2>📊 전체 진행 상태</h2>
          <div>
            <p>
              <span className={`status-indicator ${currentScript ? 'status-completed' : 'status-pending'}`} />
              스크립트 생성: {currentScript ? '완료' : '대기 중'}
            </p>
            <p>
              <span className={`status-indicator ${currentAudio ? 'status-completed' : 'status-pending'}`} />
              음성 생성: {currentAudio ? '완료' : '대기 중'}
            </p>
            <p>
              <span className={`status-indicator ${currentVideo ? 'status-completed' : 'status-pending'}`} />
              비디오 렌더링: {currentVideo ? '완료' : '대기 중'}
            </p>
          </div>
          
          {currentVideo && (
            <div style={{ marginTop: '20px' }}>
              <h3>🎉 최종 결과</h3>
              <div className="success">
                <h4>🎊 축하합니다! AI Shorts 영상이 완성되었습니다!</h4>
                <p>제목: {currentScript?.title}</p>
                <p>음성: {currentAudio?.voiceUsed}</p>
                <p>비디오: {currentVideo.resolution} @ 30fps</p>
                <p>총 길이: {currentVideo.duration}초</p>
              </div>
              <button onClick={downloadVideo} style={{ marginTop: '15px' }}>
                📥 비디오 다운로드
              </button>
              <button
                onClick={resetAll}
                style={{ marginTop: '15px', marginLeft: '10px', background: '#ff9800' }}
              >
                🔄 새로 만들기
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error">
            ❌ 오류: {error}
          </div>
        )}
        
        {/* 로그 메시지 창 */}
        <div className="log-console">
          <h2>📋 실시간 로그</h2>
          <div className="log-container">
            {logs.length === 0 ? (
              <div className="log-empty">로그가 비어있습니다...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-type">{log.type.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])} 
            className="clear-logs-btn"
            style={{ marginTop: '10px' }}
          >
            🗑️ 로그 지우기
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .main-title {
          text-align: center;
          color: #1a1a1a;
          margin-bottom: 30px;
          font-size: 2.5em;
        }
        
        .workflow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .step {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          transition: transform 0.3s ease;
        }
        
        .step:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.12);
        }
        
        .step h2 {
          color: #2196F3;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .step-number {
          background: #2196F3;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 5px;
          color: #555;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #2196F3;
        }
        
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
          width: 100%;
        }
        
        button:hover {
          background: #45a049;
        }
        
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .result-box {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin-top: 15px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .success {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .error {
          background: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .loading {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        
        audio, video {
          width: 100%;
          margin-top: 10px;
          border-radius: 6px;
        }
        
        .progress-bar {
          background: #e0e0e0;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }
        
        .progress-fill {
          background: #2196F3;
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .status-pending { background: #999; }
        .status-processing { background: #ff9800; }
        .status-completed { background: #4CAF50; }
        .status-error { background: #f44336; }
        
        .test-samples {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 6px;
        }
        
        .sample-button {
          background: #2196F3;
          margin: 5px;
          padding: 8px 16px;
          font-size: 14px;
          width: auto;
          display: inline-block;
        }
        
        .sample-button:hover {
          background: #1976D2;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .log-console {
          background: #1e1e1e;
          color: #fff;
          padding: 20px;
          border-radius: 10px;
          margin-top: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .log-console h2 {
          color: #fff;
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .log-container {
          background: #000;
          border: 1px solid #333;
          border-radius: 5px;
          padding: 10px;
          height: 300px;
          overflow-y: auto;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
        }
        
        .log-empty {
          color: #666;
          text-align: center;
          padding: 20px;
        }
        
        .log-entry {
          margin: 2px 0;
          padding: 2px 5px;
          border-radius: 3px;
        }
        
        .log-time {
          color: #888;
          margin-right: 10px;
        }
        
        .log-type {
          font-weight: bold;
          margin-right: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
        }
        
        .log-info .log-type { 
          background: #2196F3; 
          color: white;
        }
        
        .log-success .log-type { 
          background: #4CAF50; 
          color: white;
        }
        
        .log-warning .log-type { 
          background: #ff9800; 
          color: white;
        }
        
        .log-error .log-type { 
          background: #f44336; 
          color: white;
        }
        
        .log-message {
          color: #ddd;
        }
        
        .clear-logs-btn {
          background: #666;
          padding: 8px 16px;
          font-size: 14px;
          width: auto;
        }
        
        .clear-logs-btn:hover {
          background: #777;
        }
      `}</style>
    </>
  );
}