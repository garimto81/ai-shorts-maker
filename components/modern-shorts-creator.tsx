import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { 
  Upload, 
  Play, 
  Download, 
  RefreshCw, 
  FileImage, 
  Mic, 
  Video, 
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
  X,
  Image
} from 'lucide-react';

interface VideoScript {
  title: string;
  totalDuration: number;
  scenes: any[];
  narration: {
    fullText: string;
    segments: any[];
  };
  audio?: {
    audioUrl: string;
    duration: number;
    voiceUsed: string;
  };
}

interface VideoData {
  videoUrl: string;
  resolution: string;
  duration: number;
  fileSize: number;
}

interface SortedFile {
  file: File;
  originalName: string;
  sortedIndex: number;
  thumbnail?: string;
}

type Step = 'upload' | 'script' | 'audio' | 'video' | 'complete';
type VideoStyle = 'promotional' | 'educational' | 'entertainment' | 'documentary';
type EnergeticEmotion = 'excited' | 'motivated' | 'enthusiastic' | 'cheerful' | 'celebratory';

export default function ModernShortsCreator() {
  // States
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [sortedFiles, setSortedFiles] = useState<SortedFile[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('promotional');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice related states
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [emotion, setEmotion] = useState<EnergeticEmotion>('excited');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Results
  const [currentScript, setCurrentScript] = useState<VideoScript | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  
  // Logs
  const [logs, setLogs] = useState<Array<{time: string, type: string, message: string}>>([]);

  // Load voices on mount
  useEffect(() => {
    fetchVoices();
  }, []);

  // Log function
  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    const time = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, { time, type, message }].slice(-30));
  };

  // Fetch available voices
  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices');
      const result = await response.json();
      if (result.success) {
        setVoices(result.data.voices);
        addLog('success', `${result.data.voices.length}개의 목소리 로드 완료`);
      }
    } catch (err) {
      addLog('error', '목소리 목록 불러오기 실패');
    }
  };

  // Create thumbnail
  const createThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      await handleFiles(droppedFiles);
    }
  }, []);

  // Handle files
  const handleFiles = async (newFiles: File[]) => {
    setError(null);
    const allFiles = [...files, ...newFiles].slice(0, 20); // Max 20 files
    setFiles(allFiles);
    
    // Create sorted files with thumbnails
    const sortedData = await Promise.all(
      allFiles.map(async (file, index) => ({
        file,
        originalName: file.name,
        sortedIndex: index,
        thumbnail: await createThumbnail(file)
      }))
    );
    
    setSortedFiles(sortedData);
    addLog('success', `${newFiles.length}개 파일 추가됨`);
  };

  // File input handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    if (selectedFiles.length > 0) {
      await handleFiles(selectedFiles);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newSortedFiles = sortedFiles.filter((_, i) => i !== index);
    setFiles(newFiles);
    setSortedFiles(newSortedFiles);
    addLog('info', `파일 제거됨: ${sortedFiles[index].originalName}`);
  };

  // Generate script
  const generateScript = async () => {
    if (!projectTitle || files.length === 0) {
      setError('제목과 이미지를 모두 입력해주세요');
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog('info', '스크립트 생성 시작...');
    
    try {
      // Upload images first
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
      });
      
      const uploadResponse = await fetch('/api/upload-temp-images', {
        method: 'POST',
        body: formData
      });
      
      let imagePaths: string[] = [];
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          imagePaths = uploadResult.data.imagePaths;
          addLog('success', '이미지 업로드 완료');
        }
      }
      
      // Generate script
      const response = await fetch('/api/scripts/generate-video-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseScript: {
            id: 'custom_' + Date.now(),
            title: projectTitle,
            description: projectDescription || '사용자 정의 스크립트',
            category: videoStyle,
            tags: [videoStyle],
            content: {
              narration: projectDescription || projectTitle,
              scenes: []
            }
          },
          narrationSpeed: 'normal',
          videoStyle: videoStyle,
          generateAudio: true,
          voiceStyle: 'energetic',
          voiceId: selectedVoiceId,
          emotion: emotion,
          intensity: intensity,
          imagePaths: imagePaths
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentScript(result.data);
        addLog('success', '스크립트 생성 완료');
        
        if (result.data.audio) {
          addLog('success', `음성 생성 완료: ${result.data.audio.voiceUsed}`);
          setCurrentStep('audio');
        } else {
          setCurrentStep('script');
        }
      } else {
        throw new Error(result.error || '스크립트 생성 실패');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('error', `스크립트 생성 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate audio only
  const generateAudio = async () => {
    if (!currentScript) return;
    
    setLoading(true);
    setError(null);
    addLog('info', '음성 생성 시작...');
    
    try {
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: currentScript.narration.fullText,
          emotion: emotion,
          intensity: intensity,
          voiceId: selectedVoiceId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentScript({
          ...currentScript,
          audio: {
            audioUrl: result.data.audioUrl,
            duration: result.data.duration,
            voiceUsed: result.data.voiceUsed
          }
        });
        addLog('success', `음성 생성 완료: ${result.data.voiceUsed}`);
        setCurrentStep('audio');
      } else {
        throw new Error(result.error || '음성 생성 실패');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('error', `음성 생성 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate video
  const generateVideo = async () => {
    if (!currentScript || !currentScript.audio) {
      setError('먼저 스크립트와 음성을 생성해주세요');
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog('info', '비디오 렌더링 시작...');
    
    try {
      const response = await fetch('/api/videos/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: sortedFiles.map(f => f.thumbnail),
          audioUrl: currentScript.audio.audioUrl,
          videoScript: currentScript,
          outputFormat: 'mp4',
          quality: 'medium',
          resolution: '720x1280',
          frameRate: 30,
          projectTitle: currentScript.title
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentVideo(result.data);
        addLog('success', '비디오 생성 완료');
        setCurrentStep('complete');
      } else {
        throw new Error(result.error || '비디오 생성 실패');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('error', `비디오 생성 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset all
  const resetAll = () => {
    setFiles([]);
    setSortedFiles([]);
    setProjectTitle('');
    setProjectDescription('');
    setCurrentScript(null);
    setCurrentVideo(null);
    setCurrentStep('upload');
    setError(null);
    setLogs([]);
    addLog('info', '모든 데이터가 초기화되었습니다');
  };

  // Download video
  const downloadVideo = () => {
    if (currentVideo) {
      const a = document.createElement('a');
      a.href = currentVideo.videoUrl;
      a.download = `${projectTitle || 'video'}.mp4`;
      a.click();
      addLog('success', '비디오 다운로드 시작');
    }
  };

  const stepConfig = {
    upload: { icon: Upload, title: '이미지 업로드', color: 'blue' },
    script: { icon: FileImage, title: '스크립트 생성', color: 'purple' },
    audio: { icon: Mic, title: '음성 생성', color: 'green' },
    video: { icon: Video, title: '비디오 렌더링', color: 'orange' },
    complete: { icon: Check, title: '완성!', color: 'green' }
  };

  const getStepIndex = (step: Step) => {
    const steps: Step[] = ['upload', 'script', 'audio', 'video', 'complete'];
    return steps.indexOf(step);
  };

  return (
    <>
      <Head>
        <title>AI Shorts Maker - 지지프로덕션</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <Sparkles className="inline-block w-8 h-8 mr-2 text-yellow-500" />
              AI Shorts Maker
            </h1>
            <p className="text-gray-600">이미지를 업로드하고 멋진 쇼츠 영상을 만들어보세요</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {Object.entries(stepConfig).map(([key, config], index) => {
                const Icon = config.icon;
                const isActive = key === currentStep;
                const isPassed = getStepIndex(key as Step) < getStepIndex(currentStep);
                
                return (
                  <React.Fragment key={key}>
                    <div className={`flex flex-col items-center ${isActive ? 'scale-110' : ''}`}>
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${isActive ? 'bg-blue-500 text-white' : 
                          isPassed ? 'bg-green-500 text-white' : 
                          'bg-gray-200 text-gray-400'}
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm mt-2 ${isActive ? 'font-bold' : ''}`}>
                        {config.title}
                      </span>
                    </div>
                    {index < Object.keys(stepConfig).length - 1 && (
                      <ArrowRight className={`w-4 h-4 ${isPassed ? 'text-green-500' : 'text-gray-300'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Step: Upload */}
            {currentStep === 'upload' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">이미지 업로드</h2>
                
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 제목 *
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 우리 회사 신제품 소개"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="영상에 대한 추가 설명을 입력하세요..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비디오 스타일
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'promotional', label: '홍보', icon: '📢' },
                        { value: 'educational', label: '교육', icon: '📚' },
                        { value: 'entertainment', label: '엔터', icon: '🎉' },
                        { value: 'documentary', label: '다큐', icon: '🎬' }
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => setVideoStyle(style.value as VideoStyle)}
                          className={`p-3 border rounded-lg transition-all ${
                            videoStyle === style.value 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-2xl">{style.icon}</span>
                          <span className="block mt-1 text-sm">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                >
                  <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    이미지를 드래그하여 놓거나 클릭하여 선택하세요
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block">
                      파일 선택
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    최대 20개, JPG/PNG/GIF/WEBP 지원
                  </p>
                </div>

                {/* Uploaded Files */}
                {sortedFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">업로드된 이미지 ({sortedFiles.length}개)</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {sortedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={file.thumbnail}
                            alt={file.originalName}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute top-1 left-1 bg-black text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Selection */}
                {sortedFiles.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">목소리 설정</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          목소리 선택
                        </label>
                        <select
                          value={selectedVoiceId}
                          onChange={(e) => setSelectedVoiceId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          감정
                        </label>
                        <select
                          value={emotion}
                          onChange={(e) => setEmotion(e.target.value as EnergeticEmotion)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="excited">😊 신남</option>
                          <option value="motivated">💪 동기부여</option>
                          <option value="enthusiastic">🎯 열정적</option>
                          <option value="cheerful">😄 명랑함</option>
                          <option value="celebratory">🎊 축하</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          강도
                        </label>
                        <select
                          value={intensity}
                          onChange={(e) => setIntensity(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">낮음</option>
                          <option value="medium">중간</option>
                          <option value="high">높음</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <button
                  onClick={generateScript}
                  disabled={!projectTitle || sortedFiles.length === 0 || loading}
                  className="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      스크립트 생성하기
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step: Script & Audio */}
            {(currentStep === 'script' || currentStep === 'audio') && currentScript && (
              <div>
                <h2 className="text-2xl font-bold mb-6">생성된 스크립트</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-3">{currentScript.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentScript.narration.fullText}</p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span>총 {currentScript.scenes.length}개 장면</span>
                    <span className="mx-2">•</span>
                    <span>예상 길이: {currentScript.totalDuration}초</span>
                  </div>
                </div>

                {/* Audio Player */}
                {currentScript.audio && (
                  <div className="bg-green-50 p-6 rounded-lg mb-6">
                    <h3 className="font-semibold mb-3">생성된 음성</h3>
                    <audio controls className="w-full mb-3" src={currentScript.audio.audioUrl} />
                    <div className="text-sm text-gray-600">
                      <span>음성: {currentScript.audio.voiceUsed}</span>
                      <span className="mx-2">•</span>
                      <span>길이: {currentScript.audio.duration}초</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {!currentScript.audio && (
                    <button
                      onClick={generateAudio}
                      disabled={loading}
                      className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          음성 생성 중...
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          음성 생성하기
                        </>
                      )}
                    </button>
                  )}
                  
                  {currentScript.audio && (
                    <>
                      <button
                        onClick={generateAudio}
                        disabled={loading}
                        className="py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        음성 재생성
                      </button>
                      
                      <button
                        onClick={generateVideo}
                        disabled={loading}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            비디오 생성 중...
                          </>
                        ) : (
                          <>
                            <Video className="w-5 h-5 mr-2" />
                            비디오 만들기
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step: Complete */}
            {currentStep === 'complete' && currentVideo && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-12 h-12 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">비디오 생성 완료!</h2>
                  <p className="text-gray-600">멋진 쇼츠 영상이 완성되었습니다</p>
                </div>

                {/* Video Preview */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <video 
                    controls 
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                    src={currentVideo.videoUrl}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <span>해상도: {currentVideo.resolution}</span>
                    <span className="mx-2">•</span>
                    <span>길이: {currentVideo.duration}초</span>
                    <span className="mx-2">•</span>
                    <span>크기: {Math.round(currentVideo.fileSize / 1024 / 1024)}MB</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={downloadVideo}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    비디오 다운로드
                  </button>
                  
                  <button
                    onClick={resetAll}
                    className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    새로 만들기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Log Console */}
          {logs.length > 0 && (
            <div className="bg-gray-900 text-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">시스템 로그</h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  지우기
                </button>
              </div>
              <div className="bg-black rounded p-3 h-32 overflow-y-auto font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{log.time}]</span>
                    <span className={`ml-2 ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}