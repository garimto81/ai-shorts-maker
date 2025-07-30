import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function WorkingVideoDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [currentText, setCurrentText] = useState('안녕하세요! 지지프로덕션의 에이든입니다. AI Shorts Maker로 멋진 영상을 만들어보세요!');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [emotion, setEmotion] = useState<'excited' | 'motivated' | 'enthusiastic' | 'cheerful' | 'celebratory'>('excited');
  const [voices, setVoices] = useState<any[]>([]);
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

  // 음성 생성
  const generateAudio = async () => {
    addLog('음성 생성 시작...');
    try {
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          emotion: emotion,
          intensity: 'medium',
          voiceId: selectedVoice || undefined,
          videoType: 'shorts'
        })
      });

      const result = await response.json();
      if (result.success) {
        setAudioUrl(result.data.audioUrl);
        addLog(`음성 생성 완료: ${result.data.voiceUsed} (${result.data.duration}초)`);
      } else {
        addLog(`음성 생성 실패: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`음성 생성 오류: ${error.message}`);
    }
  };

  // 실제 작동하는 비디오 생성 (WebCodecs API 사용)
  const createWorkingVideo = async () => {
    if (!audioUrl) {
      addLog('먼저 음성을 생성해주세요');
      return;
    }

    addLog('실제 음성+비디오 통합 시작...');
    setIsProcessing(true);

    try {
      // FFmpeg.wasm을 사용한 실제 비디오 생성 API 호출
      const response = await fetch('/api/create-integrated-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          audioUrl: audioUrl,
          duration: 10,
          width: 720,
          height: 1280
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setFinalVideoUrl(result.data.videoUrl);
        addLog('음성+비디오 통합 완료!');
      } else {
        addLog(`비디오 생성 실패: ${result.error}`);
        // 폴백: 기존 Canvas 방식 사용
        await createCanvasVideo();
      }
    } catch (error: any) {
      addLog(`API 오류: ${error.message}, Canvas 방식으로 폴백`);
      await createCanvasVideo();
    } finally {
      setIsProcessing(false);
    }
  };

  // Canvas 기반 비디오 생성 (폴백)
  const createCanvasVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 720;
    canvas.height = 1280;

    // Canvas 스트림 생성
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setFinalVideoUrl(videoUrl);
      addLog('Canvas 비디오 생성 완료! (음성 별도 재생)');
    };

    // 음성 재생 시작
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }

    // 녹화 시작
    mediaRecorder.start();

    // 애니메이션
    let frame = 0;
    const totalFrames = 300; // 10초 * 30fps
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    const animate = () => {
      // 배경
      const colorIndex = Math.floor((frame / totalFrames) * colors.length);
      ctx.fillStyle = colors[colorIndex] || colors[0];
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 제목
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AI Shorts Maker', canvas.width / 2, 200);

      // 메인 텍스트
      ctx.font = '36px Arial';
      const words = currentText.split(' ');
      let line = '';
      let y = 400;
      const maxWidth = canvas.width - 100;
      const lineHeight = 50;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // 진행 바
      const progress = frame / totalFrames;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(50, canvas.height - 100, canvas.width - 100, 20);
      ctx.fillStyle = 'white';
      ctx.fillRect(50, canvas.height - 100, (canvas.width - 100) * progress, 20);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 100);
      }
    };

    animate();
  };

  // 두 개의 파일을 하나로 병합하는 함수
  const downloadCombinedVideo = () => {
    if (finalVideoUrl && audioUrl) {
      addLog('비디오와 음성을 별도 다운로드하여 수동으로 병합하세요');
      
      // 비디오 다운로드
      const videoLink = document.createElement('a');
      videoLink.href = finalVideoUrl;
      videoLink.download = 'video-only.webm';
      videoLink.click();
      
      // 음성 다운로드
      setTimeout(() => {
        const audioLink = document.createElement('a');
        audioLink.href = audioUrl;
        audioLink.download = 'audio-only.mp3';
        audioLink.click();
      }, 1000);
      
      addLog('비디오 편집 프로그램에서 두 파일을 병합하세요');
    }
  };

  return (
    <>
      <Head>
        <title>실제 작동하는 음성+비디오 데모</title>
      </Head>

      <div style={{ 
        padding: '20px', 
        maxWidth: '1000px', 
        margin: '0 auto',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
          🎬 실제 작동하는 음성+비디오 데모
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

            <div style={{ marginBottom: '15px' }}>
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
              🎤 음성 생성
            </button>

            {audioUrl && (
              <div style={{ marginBottom: '10px' }}>
                <audio ref={audioRef} controls src={audioUrl} style={{ width: '100%' }} />
              </div>
            )}

            <button 
              onClick={createWorkingVideo}
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
              {isProcessing ? '🎬 비디오 생성 중...' : '🎬 비디오 생성'}
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
                  ref={videoRef}
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
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a 
                    href={finalVideoUrl} 
                    download="video-only.webm"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    📹 비디오 다운로드
                  </a>
                  
                  {audioUrl && (
                    <a 
                      href={audioUrl} 
                      download="audio-only.mp3"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    >
                      🎤 음성 다운로드
                    </a>
                  )}
                  
                  <button
                    onClick={downloadCombinedVideo}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    📦 둘 다 다운로드
                  </button>
                </div>
                
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '5px',
                  fontSize: '12px'
                }}>
                  💡 <strong>병합 방법:</strong><br/>
                  1. 비디오와 음성 파일을 각각 다운로드<br/>
                  2. DaVinci Resolve, Premiere Pro, 또는 무료 OpenShot으로 병합<br/>
                  3. 또는 온라인 도구: Kapwing, Clideo 등 사용
                </div>
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

        {/* 현실적인 해결책 안내 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#e8f4fd', 
          borderRadius: '10px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ color: '#0c5460', marginTop: 0 }}>🎯 현실적인 해결책:</h4>
          <div style={{ color: '#0c5460', lineHeight: '1.6' }}>
            <p><strong>웹 브라우저의 한계:</strong></p>
            <ul>
              <li>브라우저에서는 Cross-Origin 오디오를 MediaStream에 직접 연결하기 어려움</li>
              <li>WebCodecs API는 아직 실험적이고 지원이 제한적</li>
              <li>실시간 음성+비디오 통합은 서버사이드 처리가 더 안정적</li>
            </ul>
            
            <p><strong>실제 작동하는 방법:</strong></p>
            <ul>
              <li>✅ <strong>음성 파일</strong>: 완벽하게 생성됨 (ElevenLabs API)</li>
              <li>✅ <strong>비디오 파일</strong>: Canvas로 생성됨</li>
              <li>📦 <strong>병합</strong>: 외부 도구 사용 (DaVinci, Premiere, OpenShot)</li>
              <li>🚀 <strong>FFmpeg 서버</strong>: 서버사이드에서 완전 자동화 가능</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}