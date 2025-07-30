// 브라우저 기반 TTS - 클라이언트 사이드 음성 합성
// 서버 API 없이도 작동하는 대안

export class BrowserTTS {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    } else {
      throw new Error('브라우저가 음성 합성을 지원하지 않습니다.');
    }
  }

  /**
   * 사용 가능한 음성 로드
   */
  private loadVoices() {
    this.voices = this.synth.getVoices();
    
    // 음성이 아직 로드되지 않았으면 이벤트 리스너 추가
    if (this.voices.length === 0) {
      this.synth.addEventListener('voiceschanged', () => {
        this.voices = this.synth.getVoices();
      });
    }
  }

  /**
   * 한국어 음성 찾기
   */
  getKoreanVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.startsWith('ko') || voice.lang === 'ko-KR'
    );
  }

  /**
   * 텍스트를 음성으로 변환
   */
  speak(
    text: string,
    options?: {
      voice?: string;
      rate?: number;      // 0.1 ~ 10
      pitch?: number;     // 0 ~ 2
      volume?: number;    // 0 ~ 1
      lang?: string;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 음성 선택
      if (options?.voice) {
        const selectedVoice = this.voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // 기본 한국어 음성 선택
        const koreanVoice = this.getKoreanVoices()[0];
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }
      }
      
      // 옵션 설정
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;
      utterance.lang = options?.lang || 'ko-KR';
      
      // 이벤트 핸들러
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);
      
      // 음성 재생
      this.synth.speak(utterance);
    });
  }

  /**
   * 음성 재생 중지
   */
  stop() {
    this.synth.cancel();
  }

  /**
   * 음성 재생 일시정지
   */
  pause() {
    this.synth.pause();
  }

  /**
   * 음성 재생 재개
   */
  resume() {
    this.synth.resume();
  }

  /**
   * 오디오 Blob 생성 (MediaRecorder 사용)
   */
  async generateAudioBlob(
    text: string,
    options?: any
  ): Promise<Blob> {
    // MediaRecorder를 사용하여 오디오 캡처
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          resolve(blob);
        };
        
        mediaRecorder.start();
        
        // 음성 재생
        this.speak(text, options).then(() => {
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500);
        }).catch(reject);
      });
      
    } catch (error) {
      throw new Error('오디오 캡처 실패: ' + error);
    }
  }
}

// React 컴포넌트에서 사용 예시
import { useState, useEffect } from 'react';

export function useBrowserTTS() {
  const [tts, setTTS] = useState<BrowserTTS | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const browserTTS = new BrowserTTS();
      setTTS(browserTTS);
      setIsSupported(true);
      
      // 음성 목록 로드
      setTimeout(() => {
        setVoices(browserTTS.getKoreanVoices());
      }, 100);
    }
  }, []);

  return { tts, voices, isSupported };
}