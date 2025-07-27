// TTS 음성 생성기 UI 컴포넌트 (v1.5.0)

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, 
  Download, 
  Play, 
  Pause, 
  RotateCcw,
  Mic,
  Clock,
  FileAudio,
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface VoiceConfig {
  name: string;
  language: string;
  gender: 'male' | 'female';
  description: string;
  available: boolean;
}

interface TTSGenerationResult {
  audioUrl: string;
  duration: number;
  format: string;
  sampleRate: number;
  channels: number;
  textLength: number;
  voice: string;
  style: string;
  language: string;
}

export default function TTSGeneratorUI() {
  // 상태 관리
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [style, setStyle] = useState<'neutral' | 'cheerful' | 'calm' | 'excited' | 'professional'>('neutral');
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');
  
  const [voices, setVoices] = useState<VoiceConfig[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const [generatedAudio, setGeneratedAudio] = useState<TTSGenerationResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 음성 목록 로드
  useEffect(() => {
    loadVoices();
  }, []);

  // 오디오 엘리먼트 관리
  useEffect(() => {
    if (generatedAudio && !audioElement) {
      const audio = new Audio(generatedAudio.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', () => {
        setError('오디오 재생 중 오류가 발생했습니다.');
        setIsPlaying(false);
      });
      setAudioElement(audio);
    }
  }, [generatedAudio, audioElement]);

  /**
   * 사용 가능한 음성 목록 로드
   */
  const loadVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices');
      const result = await response.json();
      
      if (result.success) {
        setVoices(result.data.voices);
        // 기본 음성 설정 (한국어 우선)
        const defaultVoice = result.data.voices.find((v: VoiceConfig) => v.language === 'ko');
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      } else {
        setError('음성 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('음성 목록 로드 오류:', error);
      setError('음성 목록을 불러올 수 없습니다.');
    }
  };

  /**
   * TTS 음성 생성
   */
  const generateSpeech = async () => {
    if (!text.trim()) {
      setError('변환할 텍스트를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAudio(null);
    setGenerationProgress(0);

    try {
      // 진행률 시뮬레이션
      const progressSteps = [
        { step: '텍스트 분석 중...', progress: 20 },
        { step: 'Gemini AI 처리 중...', progress: 50 },
        { step: '음성 합성 중...', progress: 80 },
        { step: '오디오 파일 생성 중...', progress: 95 },
        { step: '완료', progress: 100 }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          setCurrentStep(progressSteps[stepIndex].step);
          setGenerationProgress(progressSteps[stepIndex].progress);
          stepIndex++;
        }
      }, 800);

      // TTS API 호출
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          speed,
          style,
          language
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedAudio(result.data);
        setGenerationProgress(100);
        setCurrentStep('음성 생성 완료!');
        
        // 기존 오디오 정리
        if (audioElement) {
          audioElement.pause();
          setAudioElement(null);
        }
        
      } else {
        throw new Error(result.error || '음성 생성에 실패했습니다.');
      }

    } catch (error: any) {
      console.error('TTS 생성 오류:', error);
      setError(`음성 생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 오디오 재생/일시정지
   */
  const togglePlayback = () => {
    if (!audioElement || !generatedAudio) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('재생 오류:', error);
          setError('오디오 재생에 실패했습니다.');
        });
    }
  };

  /**
   * 오디오 다운로드
   */
  const downloadAudio = () => {
    if (!generatedAudio) return;

    const link = document.createElement('a');
    link.href = generatedAudio.audioUrl;
    link.download = `tts_audio_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * 폼 리셋
   */
  const resetForm = () => {
    setText('');
    setGeneratedAudio(null);
    setError(null);
    setGenerationProgress(0);
    setCurrentStep('');
    
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            TTS 음성 생성기
          </CardTitle>
          <CardDescription>
            Gemini AI를 사용하여 텍스트를 자연스러운 한국어 음성으로 변환합니다.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 오류 메시지 */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            텍스트 입력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">변환할 텍스트</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="음성으로 변환할 텍스트를 입력하세요... (최대 5000자)"
              className="min-h-32"
              maxLength={5000}
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>현재: {text.length}자</span>
              <span>최대: 5000자</span>
            </div>
          </div>

          {/* 음성 설정 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">음성</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="음성 선택" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map(voice => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">속도</label>
              <Select value={speed} onValueChange={(value: any) => setSpeed(value)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">느리게</SelectItem>
                  <SelectItem value="normal">보통</SelectItem>
                  <SelectItem value="fast">빠르게</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">스타일</label>
              <Select value={style} onValueChange={(value: any) => setStyle(value)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">자연스럽게</SelectItem>
                  <SelectItem value="cheerful">밝고 경쾌하게</SelectItem>
                  <SelectItem value="calm">차분하게</SelectItem>
                  <SelectItem value="excited">활기차게</SelectItem>
                  <SelectItem value="professional">전문적으로</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">언어</label>
              <Select value={language} onValueChange={(value: any) => setLanguage(value)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">영어</SelectItem>
                  <SelectItem value="ja">일본어</SelectItem>
                  <SelectItem value="zh">중국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 생성 버튼 */}
          <div className="flex gap-2">
            <Button 
              onClick={generateSpeech} 
              disabled={isGenerating || !text.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  음성 생성 중...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  음성 생성
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetForm} 
              variant="outline"
              disabled={isGenerating}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 진행률 */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentStep}</span>
                <span className="text-sm text-gray-500">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 결과 */}
      {generatedAudio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              음성 생성 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 오디오 정보 */}
            <div className="grid gap-2 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">재생 시간:</span>
                <span>{Math.round(generatedAudio.duration * 100) / 100}초</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">음성:</span>
                <span>{generatedAudio.voice}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">스타일:</span>
                <Badge variant="outline">{generatedAudio.style}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">파일 형식:</span>
                <span>{generatedAudio.format.toUpperCase()} ({generatedAudio.sampleRate}Hz)</span>
              </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex gap-2">
              <Button 
                onClick={togglePlayback}
                variant="outline"
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    일시정지
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    재생
                  </>
                )}
              </Button>
              
              <Button 
                onClick={downloadAudio}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}