// 비디오 렌더링 UI 컴포넌트 (v1.6.1 - 탭 인터페이스)

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, 
  Download, 
  Play, 
  Settings,
  Clock,
  HardDrive,
  Monitor,
  Zap,
  CheckCircle,
  AlertTriangle,
  Film,
  Globe,
  Server
} from 'lucide-react';
import ClientVideoRenderer from './client-video-renderer';

interface VideoRenderUIProps {
  images: string[]; // 정렬된 이미지 경로들
  audioPath?: string; // TTS 생성된 오디오 경로
  videoScript: any; // 영상화 스크립트
  projectTitle: string;
  onRenderComplete?: (result: any) => void;
}

export default function VideoRendererUI({ 
  images, 
  audioPath, 
  videoScript, 
  projectTitle,
  onRenderComplete 
}: VideoRenderUIProps) {
  
  // 서버 렌더링 상태 관리
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 렌더링 설정
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm' | 'avi'>('mp4');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [resolution, setResolution] = useState<'1920x1080' | '1280x720' | '640x360'>('1280x720');
  const [frameRate, setFrameRate] = useState<24 | 30 | 60>(30);

  /**
   * 서버 비디오 렌더링 시작
   */
  const startServerRendering = async () => {
    if (!images.length || !videoScript || !projectTitle) {
      setError('렌더링에 필요한 데이터가 부족합니다.');
      return;
    }

    setIsRendering(true);
    setError(null);
    setRenderResult(null);
    setRenderProgress(0);
    setCurrentStep('');

    try {
      // 진행률 시뮬레이션
      const progressSteps = [
        { step: 'FFmpeg 초기화 중...', progress: 5 },
        { step: '이미지 파일들을 로딩 중...', progress: 20 },
        { step: '이미지들을 비디오로 합성 중...', progress: 50 },
        { step: '오디오 합성 중...', progress: 70 },
        { step: '자막 추가 중...', progress: 85 },
        { step: '최종 비디오 생성 중...', progress: 95 },
        { step: '완료', progress: 100 }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          setCurrentStep(progressSteps[stepIndex].step);
          setRenderProgress(progressSteps[stepIndex].progress);
          stepIndex++;
        }
      }, 2000);

      // 렌더링 API 호출
      const response = await fetch('/api/videos/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          images,
          audioPath,
          videoScript,
          outputFormat,
          quality,
          resolution,
          frameRate,
          projectTitle
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setRenderResult(result.data);
        setRenderProgress(100);
        setCurrentStep('비디오 렌더링 완료!');
        onRenderComplete?.(result.data);
      } else {
        throw new Error(result.error || '비디오 렌더링에 실패했습니다.');
      }

    } catch (error: any) {
      console.error('비디오 렌더링 오류:', error);
      setError(`렌더링 실패: ${error.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  /**
   * 비디오 다운로드
   */
  const downloadVideo = () => {
    if (!renderResult) return;

    const link = document.createElement('a');
    link.href = renderResult.videoUrl;
    link.download = `${projectTitle}_video.${renderResult.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            브라우저 렌더링
          </TabsTrigger>
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            서버 렌더링
          </TabsTrigger>
        </TabsList>
        
        {/* 클라이언트 사이드 렌더링 */}
        <TabsContent value="client">
          <ClientVideoRenderer
            images={images}
            videoScript={videoScript}
            projectTitle={projectTitle}
            onRenderComplete={(blob) => {
              console.log('클라이언트 비디오 생성 완료:', blob);
            }}
          />
        </TabsContent>
        
        {/* 서버 사이드 렌더링 */}
        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-6 h-6" />
                서버 비디오 렌더링 설정
              </CardTitle>
              <CardDescription>
                서버사이드 렌더러를 사용하여 고품질 비디오를 생성합니다.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 프로젝트 정보 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3">프로젝트 정보</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">제목:</span>
                    <span>{projectTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">이미지 수:</span>
                    <span>{images.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">오디오:</span>
                    <span>{audioPath ? '✅ 포함' : '❌ 없음'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">예상 길이:</span>
                    <span>{videoScript?.totalDuration || 0}초</span>
                  </div>
                </div>
              </div>

              {/* 렌더링 설정 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    해상도
                  </label>
                  <Select value={resolution} onValueChange={(value: '1920x1080' | '1280x720' | '640x360') => setResolution(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1920x1080">Full HD (1920×1080)</SelectItem>
                      <SelectItem value="1280x720">HD (1280×720)</SelectItem>
                      <SelectItem value="640x360">SD (640×360)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    품질
                  </label>
                  <Select value={quality} onValueChange={(value: 'high' | 'medium' | 'low') => setQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">고품질 (느림)</SelectItem>
                      <SelectItem value="medium">보통 (권장)</SelectItem>
                      <SelectItem value="low">빠름 (용량 작음)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    프레임레이트
                  </label>
                  <Select value={String(frameRate)} onValueChange={(value: string) => setFrameRate(Number(value) as 24 | 30 | 60)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 FPS (영화)</SelectItem>
                      <SelectItem value="30">30 FPS (표준)</SelectItem>
                      <SelectItem value="60">60 FPS (부드러움)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    출력 형식
                  </label>
                  <Select value={outputFormat} onValueChange={(value: 'mp4' | 'webm' | 'avi') => setOutputFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (권장)</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="avi">AVI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 렌더링 시작 버튼 */}
              <Button 
                onClick={startServerRendering} 
                disabled={isRendering || !images.length}
                className="w-full"
                size="lg"
              >
                {isRendering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    서버 렌더링 중...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    🎬 서버 렌더링 시작
                  </>
                )}
              </Button>

              {/* 오류 메시지 */}
              {error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 렌더링 진행률 */}
              {isRendering && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{currentStep}</span>
                    <span className="text-sm text-gray-500">{renderProgress}%</span>
                  </div>
                  <Progress value={renderProgress} className="w-full" />
                </div>
              )}

              {/* 렌더링 결과 */}
              {renderResult && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900">서버 렌더링 완료</h3>
                  </div>
                  
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>파일 크기:</span>
                      <span>{Math.round(renderResult.fileSize / 1024 / 1024)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>재생 시간:</span>
                      <span>{renderResult.duration}초</span>
                    </div>
                    <div className="flex justify-between">
                      <span>해상도:</span>
                      <span>{renderResult.resolution}</span>
                    </div>
                  </div>

                  <Button onClick={downloadVideo} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    비디오 다운로드
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}