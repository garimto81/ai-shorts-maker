// 영상+음성 합성 통합 UI 컴포넌트

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { BrowserVideoRenderRequest } from '@/lib/browser-video-renderer-enhanced';
// 동적 임포트를 위한 타입 정의
type VideoAudioCompositor = any;
type CompositorProgress = {
  phase: 'loading' | 'processing' | 'rendering' | 'finalizing' | 'complete';
  progress: number;
  message: string;
  currentStep?: string;
};
type CompositorResult = {
  success: boolean;
  videoUrl?: string;
  videoBlob?: Blob;
  duration: number;
  fileSize: number;
  processingTime: number;
  error?: string;
};

type BrowserVideoRenderer = any;
type BrowserRenderResult = {
  success: boolean;
  videoUrl?: string;
  duration: number;
  fileSize: number;
  error?: string;
};

interface UIState {
  mode: 'browser' | 'ffmpeg' | 'server';
  images: File[];
  audioFile: File | null;
  isProcessing: boolean;
  progress: CompositorProgress | null;
  result: CompositorResult | BrowserRenderResult | null;
  error: string | null;
  previewUrls: string[];
}

interface RenderSettings {
  duration: number;
  resolution: { width: number; height: number };
  frameRate: number;
  quality: 'high' | 'medium' | 'low';
  outputFormat: 'mp4' | 'webm' | 'avi';
  projectTitle: string;
  subtitles: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

export default function VideoAudioCompositorUI() {
  const [state, setState] = useState<UIState>({
    mode: 'browser',
    images: [],
    audioFile: null,
    isProcessing: false,
    progress: null,
    result: null,
    error: null,
    previewUrls: []
  });

  const [isClient, setIsClient] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    mediaRecorder: false,
    audioContext: false,
    canvasCapture: false
  });

  useEffect(() => {
    setIsClient(true);
    
    // 브라우저 지원 기능 확인
    setBrowserSupport({
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      audioContext: typeof AudioContext !== 'undefined',
      canvasCapture: typeof HTMLCanvasElement !== 'undefined' && 
                     'captureStream' in HTMLCanvasElement.prototype
    });
  }, []);

  const [settings, setSettings] = useState<RenderSettings>({
    duration: 2,
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    quality: 'medium',
    outputFormat: 'mp4',
    projectTitle: 'My_Video',
    subtitles: []
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // 이미지 파일 선택
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // 이미지 파일만 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // 미리보기 URL 생성
    const previewUrls = imageFiles.map(file => URL.createObjectURL(file));

    setState(prev => ({
      ...prev,
      images: imageFiles,
      previewUrls,
      error: null
    }));
  }, []);

  // 음성 파일 선택
  const handleAudioSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setState(prev => ({
      ...prev,
      audioFile: file,
      error: null
    }));
  }, []);

  // 진행률 콜백
  const handleProgress = useCallback((progress: CompositorProgress) => {
    setState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  // 브라우저 모드 렌더링
  const renderWithBrowser = async () => {
    try {
      const { BrowserVideoRenderer } = await import('../lib/browser-video-renderer-enhanced');
      const renderer = new BrowserVideoRenderer();
      
      const request: BrowserVideoRenderRequest = {
        images: state.images,
        audioFile: state.audioFile || undefined,
        duration: settings.duration,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        subtitles: settings.subtitles,
        onProgress: (progress, message) => {
          setState(prev => ({
            ...prev,
            progress: {
              phase: 'processing',
              progress,
              message
            }
          }));
        }
      };

      const result = await renderer.render(request);
      
      setState(prev => ({
        ...prev,
        result,
        isProcessing: false,
        progress: null
      }));

      renderer.cleanup();

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '브라우저 렌더링 실패',
        isProcessing: false,
        progress: null
      }));
    }
  };

  // FFmpeg WebAssembly 모드 렌더링
  const renderWithFFmpeg = async () => {
    try {
      const { VideoAudioCompositor } = await import('../lib/video-audio-compositor');
      const compositor = new VideoAudioCompositor();
      compositor.setProgressCallback(handleProgress);

      const result = await compositor.compose({
        images: state.images,
        audioFile: state.audioFile || undefined,
        imageDuration: settings.duration,
        outputFormat: settings.outputFormat,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        quality: settings.quality,
        transitions: false,
        subtitles: settings.subtitles
      });

      setState(prev => ({
        ...prev,
        result,
        isProcessing: false,
        progress: null
      }));

      await compositor.cleanup();

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'FFmpeg 렌더링 실패',
        isProcessing: false,
        progress: null
      }));
    }
  };

  // 서버 모드 렌더링
  const renderWithServer = async () => {
    try {
      const formData = new FormData();
      
      // 이미지 파일들 추가
      state.images.forEach((image, index) => {
        formData.append('images', image, `image_${index.toString().padStart(3, '0')}.jpg`);
      });

      // 음성 파일 추가 (있는 경우)
      if (state.audioFile) {
        formData.append('audio', state.audioFile);
      }

      // 설정 데이터 추가
      const requestData = {
        duration: settings.duration,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        quality: settings.quality,
        outputFormat: settings.outputFormat,
        projectTitle: settings.projectTitle,
        images: state.images.map((_, index) => `image_${index.toString().padStart(3, '0')}.jpg`)
      };
      
      formData.append('data', JSON.stringify(requestData));

      // 진행률 시뮬레이션
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress < 90) {
          setState(prev => ({
            ...prev,
            progress: {
              phase: 'processing',
              progress: Math.round(progress),
              message: '서버에서 렌더링 중...'
            }
          }));
        }
      }, 1000);

      const response = await fetch('/api/videos/render-with-audio', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      setState(prev => ({
        ...prev,
        result: {
          success: result.success,
          videoUrl: result.videoUrl,
          duration: result.duration,
          fileSize: result.fileSize,
          error: result.error
        },
        isProcessing: false,
        progress: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '서버 렌더링 실패',
        isProcessing: false,
        progress: null
      }));
    }
  };

  // 렌더링 시작
  const startRendering = async () => {
    if (state.images.length === 0) {
      setState(prev => ({ ...prev, error: '이미지 파일을 선택해주세요' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      result: null,
      progress: {
        phase: 'loading',
        progress: 0,
        message: '렌더링 준비 중...'
      }
    }));

    switch (state.mode) {
      case 'browser':
        await renderWithBrowser();
        break;
      case 'ffmpeg':
        await renderWithFFmpeg();
        break;
      case 'server':
        await renderWithServer();
        break;
    }
  };

  // 파일 다운로드
  const downloadVideo = () => {
    if (state.result?.videoUrl) {
      const link = document.createElement('a');
      link.href = state.result.videoUrl;
      link.download = `${settings.projectTitle}.${settings.outputFormat}`;
      link.click();
    }
  };

  // 리소스 정리
  const cleanup = () => {
    state.previewUrls.forEach(url => URL.revokeObjectURL(url));
    if (state.result?.videoUrl) {
      URL.revokeObjectURL(state.result.videoUrl);
    }
    setState(prev => ({
      ...prev,
      images: [],
      audioFile: null,
      previewUrls: [],
      result: null,
      error: null
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎬 영상+음성 합성 테스트
            <Badge variant="outline">v2.0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 렌더링 모드 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`cursor-pointer transition-all ${state.mode === 'browser' ? 'ring-2 ring-blue-500' : ''}`} 
                  onClick={() => setState(prev => ({ ...prev, mode: 'browser' }))}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🌐</div>
                <h3 className="font-semibold">브라우저 모드</h3>
                <p className="text-sm text-gray-600">Canvas + MediaRecorder</p>
                <Badge variant={
                  isClient && browserSupport.mediaRecorder && browserSupport.canvasCapture 
                    ? 'default' 
                    : 'destructive'
                } className="mt-2">
                  {isClient && browserSupport.mediaRecorder && browserSupport.canvasCapture 
                    ? '지원됨' 
                    : '지원안됨'
                  }
                </Badge>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${state.mode === 'ffmpeg' ? 'ring-2 ring-blue-500' : ''}`} 
                  onClick={() => setState(prev => ({ ...prev, mode: 'ffmpeg' }))}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold">FFmpeg WebAssembly</h3>
                <p className="text-sm text-gray-600">브라우저에서 FFmpeg 실행</p>
                <Badge variant="default" className="mt-2">고품질</Badge>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${state.mode === 'server' ? 'ring-2 ring-blue-500' : ''}`} 
                  onClick={() => setState(prev => ({ ...prev, mode: 'server' }))}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🖥️</div>
                <h3 className="font-semibold">서버 모드</h3>
                <p className="text-sm text-gray-600">서버사이드 FFmpeg</p>
                <Badge variant="default" className="mt-2">최고품질</Badge>
              </CardContent>
            </Card>
          </div>

          {/* 파일 업로드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                이미지 파일들 (필수)
              </label>
              <Input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="mb-2"
              />
              {state.images.length > 0 && (
                <Badge variant="outline">
                  {state.images.length}개 이미지 선택됨
                </Badge>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                음성 파일 (선택사항)
              </label>
              <Input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="mb-2"
              />
              {state.audioFile && (
                <Badge variant="outline">
                  {state.audioFile.name}
                </Badge>
              )}
            </div>
          </div>

          {/* 이미지 미리보기 */}
          {state.previewUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">이미지 미리보기</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {state.previewUrls.map((url, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <div className="text-xs text-center mt-1">{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 렌더링 설정 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">이미지 표시 시간 (초)</label>
              <Input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={settings.duration}
                onChange={(e) => setSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">해상도</label>
              <Select 
                value={`${settings.resolution.width}x${settings.resolution.height}`}
                onValueChange={(value) => {
                  const [width, height] = value.split('x').map(Number);
                  setSettings(prev => ({ ...prev, resolution: { width, height } }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1080x1920">1080x1920 (세로형)</SelectItem>
                  <SelectItem value="1920x1080">1920x1080 (가로형)</SelectItem>
                  <SelectItem value="720x1280">720x1280 (세로형 HD)</SelectItem>
                  <SelectItem value="540x960">540x960 (세로형 SD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">품질</label>
              <Select 
                value={settings.quality}
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setSettings(prev => ({ ...prev, quality: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">고품질</SelectItem>
                  <SelectItem value="medium">중품질</SelectItem>
                  <SelectItem value="low">저품질</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">출력 형식</label>
              <Select 
                value={settings.outputFormat}
                onValueChange={(value: 'mp4' | 'webm' | 'avi') => 
                  setSettings(prev => ({ ...prev, outputFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">프로젝트 제목</label>
            <Input
              value={settings.projectTitle}
              onChange={(e) => setSettings(prev => ({ ...prev, projectTitle: e.target.value }))}
              placeholder="영상 파일명으로 사용됩니다"
            />
          </div>

          {/* 에러 표시 */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* 진행률 표시 */}
          {state.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{state.progress.message}</span>
                <span>{state.progress.progress}%</span>
              </div>
              <Progress value={state.progress.progress} />
              <div className="text-xs text-gray-500">
                단계: {state.progress.phase}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            <Button 
              onClick={startRendering} 
              disabled={state.isProcessing || state.images.length === 0}
              className="flex-1"
            >
              {state.isProcessing ? '렌더링 중...' : '🎬 영상 생성 시작'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={cleanup}
              disabled={state.isProcessing}
            >
              🗑️ 초기화
            </Button>
          </div>

          {/* 결과 표시 */}
          {state.result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {state.result.success ? '✅' : '❌'} 렌더링 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.result.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">재생시간:</span><br />
                        {Math.round(state.result.duration)}초
                      </div>
                      <div>
                        <span className="font-medium">파일크기:</span><br />
                        {(state.result.fileSize / 1024 / 1024).toFixed(2)}MB
                      </div>
                      {'processingTime' in state.result && (
                        <div>
                          <span className="font-medium">처리시간:</span><br />
                          {(state.result.processingTime / 1000).toFixed(1)}초
                        </div>
                      )}
                      {('resolution' in state.result && state.result.resolution) ? (
                        <div>
                          <span className="font-medium">해상도:</span><br />
                          {typeof state.result.resolution === 'object' 
                            ? `${(state.result.resolution as any).width}x${(state.result.resolution as any).height}`
                            : String(state.result.resolution)}
                        </div>
                      ) : null}
                    </div>

                    {state.result.videoUrl && (
                      <div className="space-y-2">
                        <video 
                          src={state.result.videoUrl} 
                          controls 
                          className="w-full max-w-md mx-auto rounded border"
                        >
                          브라우저가 비디오를 지원하지 않습니다.
                        </video>
                        
                        <div className="flex gap-2 justify-center">
                          <Button onClick={downloadVideo}>
                            📥 다운로드
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => window.open(state.result!.videoUrl, '_blank')}
                          >
                            🔗 새 탭에서 열기
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {state.result.error || '렌더링에 실패했습니다'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}