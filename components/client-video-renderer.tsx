// 클라이언트 사이드 비디오 렌더러 컴포넌트

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Download, AlertTriangle, Play } from 'lucide-react';
import { BrowserVideoRenderer } from '@/lib/browser-video-renderer';

interface ClientVideoRendererProps {
  images: string[]; // 이미지 URL 배열
  videoScript?: any;
  projectTitle: string;
  onRenderComplete?: (videoBlob: Blob) => void;
}

export default function ClientVideoRenderer({
  images,
  videoScript,
  projectTitle,
  onRenderComplete
}: ClientVideoRendererProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startRendering = async () => {
    if (!images || images.length === 0) {
      setError('렌더링할 이미지가 없습니다.');
      return;
    }
    
    setIsRendering(true);
    setError(null);
    setProgress(0);
    
    try {
      console.log('🎥 클라이언트 비디오 렌더링 시작...');
      
      const renderer = new BrowserVideoRenderer();
      
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      // 자막 데이터 준비
      const subtitles = videoScript?.narration?.segments?.map((seg: any) => ({
        text: seg.text,
        startTime: seg.startTime,
        endTime: seg.endTime
      })) || [];
      
      // 동적 시간 계산 (최대 60초, 이미지 수에 따라 조정)
      const maxDuration = 60;
      const totalDuration = videoScript?.totalDuration || Math.min(images.length * 3, maxDuration);
      const durationPerImage = Math.min(Math.max(totalDuration / images.length, 2), 5); // 이미지당 2-5초
      
      console.log('📹 비디오 설정:', {
        totalImages: images.length,
        totalDuration: totalDuration,
        durationPerImage: durationPerImage.toFixed(1)
      });
      
      // 비디오 렌더링 (쇼츠 형식 9:16)
      const result = await renderer.render({
        images: images,
        duration: durationPerImage, // 동적 계산된 시간
        resolution: { width: 1080, height: 1920 }, // 9:16 비율
        frameRate: 30,
        transitions: true,
        maxTotalDuration: maxDuration, // 60초 제한
        subtitles: subtitles
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success && result.videoBlob) {
        // Blob URL 생성
        const url = URL.createObjectURL(result.videoBlob);
        setVideoBlob(result.videoBlob);
        setVideoUrl(url);
        
        console.log('✅ 클라이언트 비디오 렌더링 완료:', {
          size: Math.round(result.videoBlob.size / 1024 / 1024 * 10) / 10 + 'MB',
          type: result.videoBlob.type
        });
        
        // 완료 콜백
        onRenderComplete?.(result.videoBlob);
      } else {
        throw new Error(result.error || '비디오 생성 실패');
      }
      
    } catch (err: any) {
      console.error('❌ 렌더링 오류:', err);
      setError(err.message || '비디오 렌더링 중 오류가 발생했습니다.');
    } finally {
      setIsRendering(false);
    }
  };
  
  const downloadVideo = () => {
    if (!videoBlob) return;
    
    const link = document.createElement('a');
    link.href = videoUrl!;
    link.download = `${projectTitle}_video.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 컴포넌트 언마운트 시 Blob URL 해제
  React.useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            브라우저 비디오 렌더링
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 렌더링 정보 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">렌더링 정보</h3>
            <div className="text-sm space-y-1">
              <div>• 이미지 수: {images.length}개</div>
              <div>• 예상 길이: {(() => {
                const maxDuration = 60;
                const totalDuration = videoScript?.totalDuration || Math.min(images.length * 3, maxDuration);
                return totalDuration;
              })()}초 (최대 60초)</div>
              <div>• 해상도: 1080×1920 (Shorts 9:16)</div>
              <div>• 형식: WebM (VP9)</div>
              <div>• 자막: {videoScript?.narration?.segments?.length || 0}개</div>
            </div>
          </div>
          
          {/* 오류 메시지 */}
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* 렌더링 버튼 */}
          {!videoUrl && (
            <Button
              onClick={startRendering}
              disabled={isRendering || images.length === 0}
              className="w-full"
              size="lg"
            >
              {isRendering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  렌더링 중...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  브라우저에서 비디오 생성
                </>
              )}
            </Button>
          )}
          
          {/* 진행률 표시 */}
          {isRendering && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>렌더링 진행률</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 text-center">
                브라우저에서 실시간으로 비디오를 생성하고 있습니다...
              </p>
            </div>
          )}
          
          {/* 비디오 미리보기 */}
          {videoUrl && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full"
                  style={{ maxHeight: '400px' }}
                >
                  브라우저에서 비디오를 재생할 수 없습니다.
                </video>
              </div>
              
              {/* 다운로드 버튼 */}
              <div className="flex gap-2">
                <Button
                  onClick={() => videoRef.current?.play()}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </Button>
                
                <Button
                  onClick={downloadVideo}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  비디오 다운로드 (WebM)
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                * MP4 형식이 필요한 경우 서버 변환 기능을 이용하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}