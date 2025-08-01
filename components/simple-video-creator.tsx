import React, { useState, useCallback, useRef } from 'react';
import { Upload, Video, Download, Play, RotateCcw, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';
import { SimpleVideoRenderer } from '@/lib/simple-video-renderer';

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

export function SimpleVideoCreator() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);
  
  const [settings, setSettings] = useState({
    resolution: RESOLUTIONS[0],
    frameRate: 30,
    duration: 3
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<SimpleVideoRenderer | null>(null);

  // 브라우저 지원 확인
  React.useEffect(() => {
    const supported = SimpleVideoRenderer.isSupported();
    setBrowserSupported(supported);
    console.log('브라우저 지원:', supported);
  }, []);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('이미지 파일을 선택해주세요.');
      return;
    }

    if (imageFiles.length > 20) {
      setError('최대 20개의 이미지만 업로드할 수 있습니다.');
      return;
    }
    
    const newImages: ProcessedImage[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}_${index}`,
      file,
      preview: URL.createObjectURL(file),
      order: images.length + index
    }));
    
    setImages(prev => [...prev, ...newImages]);
    setError('');
  }, [images.length]);

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

  // 이미지 순서 변경
  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    
    // 순서 재정렬
    newImages.forEach((img, index) => {
      img.order = index;
    });
    
    setImages(newImages);
  }, [images]);

  // 비디오 생성
  const createVideo = useCallback(async () => {
    if (images.length === 0) {
      setError('최소 1개의 이미지를 업로드해주세요.');
      return;
    }

    if (!browserSupported) {
      setError('현재 브라우저는 비디오 생성을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setProgressMessage('비디오 생성 준비 중...');
    setError('');

    try {
      if (!rendererRef.current) {
        rendererRef.current = new SimpleVideoRenderer();
      }

      const sortedImages = [...images].sort((a, b) => a.order - b.order);
      
      const result = await rendererRef.current.render({
        images: sortedImages.map(img => img.file),
        duration: settings.duration,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        onProgress: (progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
        }
      });

      setVideoUrl(result.videoUrl);
      setProgressMessage('비디오 생성 완료!');
      
    } catch (error) {
      console.error('비디오 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '비디오 생성 중 알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setProgressMessage('');
    } finally {
      setIsRendering(false);
    }
  }, [images, settings, browserSupported]);

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
    setVideoUrl('');
    setProgress(0);
    setProgressMessage('');
    setError('');
    rendererRef.current = null;
  }, []);

  if (browserSupported === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">브라우저 지원 불가</h2>
          <p className="text-red-600 mb-4">
            현재 브라우저는 비디오 생성 기능을 지원하지 않습니다.
          </p>
          <div className="bg-white rounded-lg p-4 text-left">
            <h3 className="font-semibold mb-2">권장 브라우저:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Google Chrome (최신 버전)</li>
              <li>Microsoft Edge (최신 버전)</li>
              <li>Mozilla Firefox (최신 버전)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">간단 비디오 만들기</h1>
        <p className="text-gray-600">이미지를 업로드하고 비디오로 변환하세요</p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 설정 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          비디오 설정
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">해상도</label>
            <select
              value={settings.resolution.label}
              onChange={(e) => {
                const resolution = RESOLUTIONS.find(r => r.label === e.target.value);
                if (resolution) {
                  setSettings(prev => ({ ...prev, resolution }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {RESOLUTIONS.map(res => (
                <option key={res.label} value={res.label}>{res.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">프레임레이트</label>
            <select
              value={settings.frameRate}
              onChange={(e) => setSettings(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">이미지당 표시 시간</label>
            <select
              value={settings.duration}
              onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="1">1초</option>
              <option value="2">2초</option>
              <option value="3">3초</option>
              <option value="5">5초</option>
            </select>
          </div>
        </div>
      </div>

      {/* 이미지 업로드 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">이미지 업로드</h2>
        
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">이미지를 선택하거나 드래그하세요 (최대 20개)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isRendering}
          />
        </label>
      </div>

      {/* 이미지 미리보기 */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            업로드된 이미지 ({images.length}개)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.sort((a, b) => a.order - b.order).map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt={`이미지 ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isRendering}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            총 비디오 길이: {images.length * settings.duration}초
          </p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={createVideo}
          disabled={isRendering || images.length === 0}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          {isRendering ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              처리 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              비디오 생성
            </>
          )}
        </button>
        
        {videoUrl && (
          <button
            onClick={downloadVideo}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            다운로드
          </button>
        )}
        
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          초기화
        </button>
      </div>

      {/* 진행 상황 */}
      {isRendering && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">비디오 생성 중...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{progressMessage}</p>
        </div>
      )}

      {/* 비디오 미리보기 */}
      {videoUrl && !isRendering && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">생성된 비디오</h2>
          </div>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}