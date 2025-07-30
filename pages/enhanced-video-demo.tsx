import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

interface VideoConfig {
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export default function EnhancedVideoDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [currentText, setCurrentText] = useState('안녕하세요! 지지프로덕션의 에이든입니다. AI Shorts Maker로 멋진 영상을 만들어보세요!');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [emotion, setEmotion] = useState<'excited' | 'motivated' | 'enthusiastic' | 'cheerful' | 'celebratory'>('excited');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [voices, setVoices] = useState<any[]>([]);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
    duration: 10,
    fps: 30,
    width: 720,
    height: 1280
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-20));
  };

  // 목소리 목록 불러오기
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      addLog('목소리 목록 불러오는 중...');
      const response = await fetch('/api/tts/voices');
      const result = await response.json();
      if (result.success) {
        setVoices(result.data.voices);
        addLog(`${result.data.voices.length}개의 목소리 로드 완료`);
      }
    } catch (error: any) {
      addLog(`목소리 목록 오류: ${error.message}`);
    }
  };

  // 고품질 음성 생성
  const generateAudio = async () => {
    addLog('고품질 음성 생성 시작...');
    try {
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          emotion: emotion,
          intensity: intensity,
          voiceId: selectedVoice || undefined,
          videoType: 'shorts'
        })
      });

      const result = await response.json();
      if (result.success) {
        setAudioUrl(result.data.audioUrl);
        addLog(`음성 생성 완료: ${result.data.voiceUsed} (${result.data.duration}초)`);
        
        // 음성 길이에 맞게 비디오 길이 조정
        setVideoConfig(prev => ({
          ...prev,
          duration: Math.ceil(result.data.duration)
        }));
      } else {
        addLog(`음성 생성 실패: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`음성 생성 오류: ${error.message}`);
    }
  };

  // 향상된 비디오 생성
  const createEnhancedVideo = async () => {
    if (!audioUrl) {
      addLog('먼저 음성을 생성해주세요');
      return;
    }

    addLog('향상된 비디오 생성 시작...');
    setIsProcessing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoConfig.width;
    canvas.height = videoConfig.height;

    try {
      // 음성 파일 로드
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      const audioElement = new Audio(URL.createObjectURL(audioBlob));
      
      // Canvas 스트림 생성
      const stream = canvas.captureStream(videoConfig.fps);
      
      // 가능한 경우 오디오 트랙 추가
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioElement);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioContext.destination);
      
      // 비디오와 오디오 스트림 결합
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // MediaRecorder 설정
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5Mbps
        audioBitsPerSecond: 128000   // 128kbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setFinalVideoUrl(videoUrl);
        setIsProcessing(false);
        addLog('향상된 비디오 생성 완료!');
      };

      // 녹화 시작
      mediaRecorder.start(100); // 100ms 간격으로 데이터 수집
      audioElement.play();

      // 향상된 애니메이션
      let frame = 0;
      const totalFrames = videoConfig.duration * videoConfig.fps;
      const gradients = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140']
      ];

      const animate = () => {
        const progress = frame / totalFrames;
        
        // 동적 그라디언트 배경
        const gradientIndex = Math.floor(progress * gradients.length);
        const currentGradient = gradients[gradientIndex] || gradients[0];
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, currentGradient[0]);
        gradient.addColorStop(1, currentGradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 동적 형태들
        const time = frame * 0.05;
        for (let i = 0; i < 5; i++) {
          const x = (Math.sin(time + i) * 100) + canvas.width / 2;
          const y = (Math.cos(time + i * 0.7) * 100) + canvas.height / 2;
          const radius = 30 + Math.sin(time + i * 2) * 20;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 제목 (그림자 효과)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 52px "Noto Sans KR", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AI Shorts Maker', canvas.width / 2, 180);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 메인 텍스트 (다중 라인, 애니메이션)
        ctx.font = '38px "Noto Sans KR", Arial, sans-serif';
        const words = currentText.split(' ');
        let currentLine = '';
        const lines: string[] = [];
        const maxWidth = canvas.width - 80;

        // 텍스트를 줄별로 나누기
        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine.trim());

        // 애니메이션된 텍스트 렌더링
        const textStartY = 350;
        const lineHeight = 55;
        const revealProgress = Math.min(1, progress * 2); // 텍스트가 점진적으로 나타남
        
        lines.forEach((line, index) => {
          const lineProgress = Math.max(0, Math.min(1, revealProgress * lines.length - index));
          ctx.globalAlpha = lineProgress;
          
          const y = textStartY + (index * lineHeight);
          ctx.fillText(line, canvas.width / 2, y);
        });
        
        ctx.globalAlpha = 1;

        // 하단 브랜딩
        ctx.font = '28px "Noto Sans KR", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('지지프로덕션', canvas.width / 2, canvas.height - 120);

        // 진행 바 (더 세련된 디자인)
        const progressBarY = canvas.height - 60;
        const progressBarWidth = canvas.width - 100;
        const progressBarHeight = 6;
        const progressBarX = 50;
        
        // 배경
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 3);
        ctx.fill();
        
        // 진행도
        ctx.fillStyle = 'white';
        ctx.roundRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 3);
        ctx.fill();

        frame++;
        if (frame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            mediaRecorder.stop();
            audioElement.pause();
          }, 200);
        }
      };

      animate();

    } catch (error: any) {
      addLog(`비디오 생성 오류: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>향상된 음성+비디오 통합 데모</title>
      </Head>

      <div style={{ 
        padding: '20px', 
        maxWidth: '1000px', 
        margin: '0 auto',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
          🎬 향상된 음성+비디오 통합 데모
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* 좌측: 설정 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>🎯 비디오 설정</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                텍스트 내용
              </label>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                목소리 선택
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              >
                <option value="">자동 선택</option>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  감정
                </label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value as any)}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="excited">😊 신남</option>
                  <option value="motivated">💪 동기부여</option>
                  <option value="enthusiastic">🎯 열정적</option>
                  <option value="cheerful">😄 명랑함</option>
                  <option value="celebratory">🎊 축하</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  강도
                </label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                </select>
              </div>
            </div>

            <button 
              onClick={generateAudio}
              disabled={!currentText}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              🎤 고품질 음성 생성
            </button>

            {audioUrl && (
              <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '10px' }} />
            )}

            <button 
              onClick={createEnhancedVideo}
              disabled={!audioUrl || isProcessing}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isProcessing ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? '🎬 비디오 생성 중...' : '🎬 향상된 비디오 생성'}
            </button>
          </div>

          {/* 우측: 결과 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>🎉 완성된 비디오</h3>
            
            {finalVideoUrl ? (
              <div>
                <video 
                  controls 
                  style={{ 
                    width: '100%', 
                    maxWidth: '300px',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    marginBottom: '15px'
                  }}
                  src={finalVideoUrl}
                />
                <br />
                <a 
                  href={finalVideoUrl} 
                  download="enhanced-ai-shorts.webm"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold'
                  }}
                >
                  📥 고품질 비디오 다운로드
                </a>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#6c757d',
                border: '2px dashed #dee2e6',
                borderRadius: '10px'
              }}>
                먼저 음성을 생성하고 비디오를 만들어보세요!
              </div>
            )}
          </div>
        </div>

        {/* 숨겨진 Canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 로그 */}
        <div style={{ 
          backgroundColor: '#2c3e50', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '10px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📋 실시간 로그</h4>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto',
            backgroundColor: '#34495e',
            padding: '10px',
            borderRadius: '5px'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
            ))}
          </div>
        </div>

        {/* 특징 설명 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#e8f4fd', 
          borderRadius: '10px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ color: '#0c5460', marginTop: 0 }}>✨ 향상된 기능들:</h4>
          <ul style={{ color: '#0c5460', lineHeight: '1.6' }}>
            <li>🎤 <strong>고품질 한국어 TTS</strong> - ElevenLabs API with 감정/강도 조절</li>
            <li>🎨 <strong>동적 그라디언트 배경</strong> - 시간에 따라 변화하는 배경색</li>
            <li>✨ <strong>애니메이션 효과</strong> - 텍스트 점진적 나타남, 동적 형태들</li>
            <li>🎬 <strong>음성-비디오 동기화</strong> - 음성 길이에 맞춘 자동 비디오 길이 조절</li>
            <li>📱 <strong>쇼츠 최적화</strong> - 720x1280 세로형 해상도</li>
            <li>💎 <strong>고품질 인코딩</strong> - VP9 + Opus 코덱, 2.5Mbps 비트레이트</li>
          </ul>
        </div>
      </div>
    </>
  );
}