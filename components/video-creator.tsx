import React, { useState, useCallback, useRef } from 'react';
import { Upload, Video, Download, Play, Pause, RotateCcw, Settings, Music, Image as ImageIcon } from 'lucide-react';
import { EnhancedVideoRenderer } from '@/lib/enhanced-video-renderer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface VideoSettings {
  resolution: { width: number; height: number; label: string };
  frameRate: number;
  duration: number; // 초 단위
  transitions: boolean;
}

interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  order: number;
}

const RESOLUTIONS = [
  { width: 720, height: 1280, label: '720x1280 (쇼츠/릴스)' },
  { width: 1080, height: 1920, label: '1080x1920 (쇼츠 HD)' },
  { width: 1920, height: 1080, label: '1920x1080 (가로형)' },
  { width: 1280, height: 720, label: '1280x720 (가로형 HD)' }
];

export function VideoCreator() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: RESOLUTIONS[0],
    frameRate: 30,
    duration: 3,
    transitions: true
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<EnhancedVideoRenderer | null>(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages: ProcessedImage[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}_${index}`,
      file,
      preview: URL.createObjectURL(file),
      order: images.length + index
    }));
    
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  // 오디오 업로드 핸들러
  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    }
  }, []);

  // 이미지 순서 변경
  const reorderImages = useCallback((dragIndex: number, dropIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    
    // 순서 재정렬
    newImages.forEach((img, index) => {
      img.order = index;
    });
    
    setImages(newImages);
  }, [images]);

  // 이미지 삭제
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // 순서 재정렬
      filtered.forEach((img, index) => {
        img.order = index;
      });
      return filtered;
    });
  }, []);

  // 비디오 생성
  const createVideo = useCallback(async () => {
    if (images.length === 0) {
      alert('이미지를 업로드해주세요.');
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setProgressMessage('비디오 생성 준비 중...');

    try {
      if (!rendererRef.current) {
        rendererRef.current = new EnhancedVideoRenderer();
      }

      const sortedImages = [...images].sort((a, b) => a.order - b.order);
      
      const result = await rendererRef.current.render({
        images: sortedImages.map(img => img.file),
        audioFile: audioFile || undefined,
        duration: videoSettings.duration,
        resolution: videoSettings.resolution,
        frameRate: videoSettings.frameRate,
        transitions: videoSettings.transitions ? {
          enabled: true,
          type: 'fade',
          duration: 0.5
        } : undefined,
        watermark: {
          text: 'AI Shorts Maker',
          position: 'bottom-right'
        },
        onProgress: (progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
        }
      });

      const videoUrl = URL.createObjectURL(result.videoBlob);
      setVideoUrl(videoUrl);
      setProgressMessage('비디오 생성 완료!');
    } catch (error) {
      console.error('비디오 생성 오류:', error);
      alert(error instanceof Error ? error.message : '비디오 생성 중 오류가 발생했습니다.');
      setProgressMessage('');
    } finally {
      setIsRendering(false);
    }
  }, [images, audioFile, videoSettings]);

  // 비디오 다운로드
  const downloadVideo = useCallback(() => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `ai-shorts-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [videoUrl]);

  // 초기화
  const reset = useCallback(() => {
    setImages([]);
    setAudioFile(null);
    setVideoUrl('');
    setProgress(0);
    setProgressMessage('');
    
    // Enhanced renderer doesn't have cleanup method, just reset ref
    rendererRef.current = null;
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Video className="w-6 h-6" />
          AI 비디오 생성기
        </h2>
        
        {/* 설정 섹션 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            비디오 설정
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">해상도</label>
              <select
                value={videoSettings.resolution.label}
                onChange={(e) => {
                  const resolution = RESOLUTIONS.find(r => r.label === e.target.value);
                  if (resolution) {
                    setVideoSettings(prev => ({ ...prev, resolution }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                {RESOLUTIONS.map(res => (
                  <option key={res.label} value={res.label}>{res.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">프레임레이트</label>
              <select
                value={videoSettings.frameRate}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="24">24 FPS</option>
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">이미지당 표시 시간</label>
              <select
                value={videoSettings.duration}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="1">1초</option>
                <option value="2">2초</option>
                <option value="3">3초</option>
                <option value="5">5초</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">전환 효과</label>
              <select
                value={videoSettings.transitions ? 'on' : 'off'}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, transitions: e.target.value === 'on' }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="on">켜기</option>
                <option value="off">끄기</option>
              </select>
            </div>
          </div>
        </div>

        {/* 업로드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">이미지 업로드 (여러 개 가능)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Music className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">배경 음악 업로드 (선택사항)</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </label>
            {audioFile && (
              <p className="text-sm text-green-600 mt-2">
                음악 파일: {audioFile.name}
              </p>
            )}
          </div>
        </div>

        {/* 이미지 미리보기 */}
        {images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">업로드된 이미지 ({images.length}개)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.sort((a, b) => a.order - b.order).map((image, index) => (
                <div
                  key={image.id}
                  className="relative group"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragIndex = parseInt(e.dataTransfer.getData('index'));
                    reorderImages(dragIndex, index);
                  }}
                >
                  <img
                    src={image.preview}
                    alt={`이미지 ${index + 1}`}
                    className="w-full h-24 object-cover rounded cursor-move"
                  />
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              드래그하여 순서를 변경할 수 있습니다. 총 길이: {images.length * videoSettings.duration}초
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <Button
            onClick={createVideo}
            disabled={isRendering || images.length === 0}
            className="flex items-center gap-2"
          >
            {isRendering ? (
              <>처리 중...</>
            ) : (
              <>
                <Play className="w-4 h-4" />
                비디오 생성
              </>
            )}
          </Button>
          
          {videoUrl && (
            <Button
              onClick={downloadVideo}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </Button>
          )}
          
          <Button
            onClick={reset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </Button>
        </div>

        {/* 진행 상황 */}
        {isRendering && (
          <div className="mt-6">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-600">{progressMessage}</p>
          </div>
        )}

        {/* 비디오 미리보기 */}
        {videoUrl && !isRendering && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">생성된 비디오</h3>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </Card>
    </div>
  );
}