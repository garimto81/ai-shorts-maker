import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function SimpleVideoDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [currentText, setCurrentText] = useState('안녕하세요! AI Shorts Maker 데모입니다.');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
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
          emotion: 'excited',
          intensity: 'medium'
        })
      });

      const result = await response.json();
      if (result.success) {
        setAudioUrl(result.data.audioUrl);
        addLog(`음성 생성 완료: ${result.data.voiceUsed}`);
      } else {
        addLog(`음성 생성 실패: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`음성 생성 오류: ${error.message}`);
    }
  };

  // 간단한 비디오 생성 (Canvas + 이미지 슬라이드쇼)
  const createSimpleVideo = async () => {
    if (!audioUrl) {
      addLog('먼저 음성을 생성해주세요');
      return;
    }

    addLog('비디오 생성 시작...');
    setIsRecording(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 설정 (세로형 비디오)
    canvas.width = 720;
    canvas.height = 1280;

    // 미디어 스트림 생성
    const stream = canvas.captureStream(30); // 30fps

    // 오디오 추가
    try {
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      const audioElement = new Audio(URL.createObjectURL(audioBlob));
      
      // MediaRecorder 설정
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
        setIsRecording(false);
        addLog('비디오 생성 완료!');
      };

      // 녹화 시작
      mediaRecorder.start();
      audioElement.play();

      // 간단한 애니메이션 (텍스트와 배경색 변화)
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

        // 메인 텍스트 (여러 줄 처리)
        ctx.font = '36px Arial';
        const words = currentText.split(' ');
        let line = '';
        let y = 400;
        const maxWidth = canvas.width - 100;
        const lineHeight = 50;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
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
          // 녹화 종료
          setTimeout(() => {
            mediaRecorder.stop();
            audioElement.pause();
          }, 100);
        }
      };

      animate();

    } catch (error: any) {
      addLog(`비디오 생성 오류: ${error.message}`);
      setIsRecording(false);
    }
  };

  return (
    <>
      <Head>
        <title>간단한 음성+비디오 데모</title>
      </Head>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🎬 간단한 음성+비디오 통합 데모</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>1. 텍스트 입력</h3>
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px', 
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
            placeholder="비디오에 표시할 텍스트를 입력하세요..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>2. 음성 생성</h3>
          <button 
            onClick={generateAudio}
            disabled={!currentText}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            음성 생성하기
          </button>
          
          {audioUrl && (
            <div style={{ marginTop: '10px' }}>
              <p>✅ 음성 생성 완료!</p>
              <audio controls src={audioUrl} style={{ width: '100%' }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>3. 비디오 생성</h3>
          <button 
            onClick={createSimpleVideo}
            disabled={!audioUrl || isRecording}
            style={{
              padding: '10px 20px',
              backgroundColor: isRecording ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isRecording ? 'not-allowed' : 'pointer'
            }}
          >
            {isRecording ? '비디오 생성 중...' : '비디오 생성하기'}
          </button>
        </div>

        {/* Canvas (숨김) */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* 최종 비디오 */}
        {finalVideoUrl && (
          <div style={{ marginBottom: '20px' }}>
            <h3>🎉 완성된 비디오</h3>
            <video 
              ref={videoRef}
              controls 
              style={{ 
                width: '300px', 
                height: '533px', 
                border: '1px solid #ddd',
                borderRadius: '10px'
              }}
              src={finalVideoUrl}
            />
            <br />
            <a 
              href={finalVideoUrl} 
              download="ai-shorts-demo.webm"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              📥 비디오 다운로드
            </a>
          </div>
        )}

        {/* 로그 */}
        <div style={{ marginTop: '20px' }}>
          <h3>📋 진행 로그</h3>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '5px',
            height: '200px',
            overflowY: 'auto',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '5px' 
        }}>
          <h4>💡 이 데모의 특징:</h4>
          <ul>
            <li>✅ 실제 ElevenLabs API로 한국어 음성 생성</li>
            <li>✅ HTML5 Canvas로 간단한 비디오 생성</li>
            <li>✅ 음성과 비디오 실시간 동기화</li>
            <li>✅ 웹 브라우저에서 직접 실행 (FFmpeg 불필요)</li>
            <li>✅ WebM 형식으로 다운로드 가능</li>
          </ul>
        </div>
      </div>
    </>
  );
}