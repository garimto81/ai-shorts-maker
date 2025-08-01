// 음성+비디오 합성 테스트 페이지

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Play, 
  Download, 
  Mic, 
  Video, 
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  FileAudio,
  Settings
} from 'lucide-react';
import AudioGuide from '../../components/audio-guide';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export default function AudioVideoTestPage() {
  const [testImages, setTestImages] = useState<File[]>([]);
  const [testAudio, setTestAudio] = useState<File | null>(null);
  const [testMode, setTestMode] = useState<'tts' | 'upload'>('tts');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  // 테스트 로그 추가
  const addResult = (test: TestResult) => {
    setResults(prev => [...prev, { ...test, timestamp: Date.now() }]);
  };

  // 샘플 이미지 생성
  const generateSampleImages = async () => {
    setLoading(true);
    addResult({ success: false, message: '샘플 이미지 생성 중...', duration: 0 });

    try {
      const response = await fetch('/api/test/create-sample-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
      });

      const result = await response.json();
      if (result.success) {
        addResult({ 
          success: true, 
          message: `샘플 이미지 ${result.data.images.length}개 생성 완료`,
          data: result.data,
          duration: result.processingTime 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      addResult({ 
        success: false, 
        message: '샘플 이미지 생성 실패', 
        error: error.message,
        duration: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  // TTS 음성 생성 테스트
  const testTTSGeneration = async () => {
    setLoading(true);
    addResult({ success: false, message: 'TTS 음성 생성 테스트 중...', duration: 0 });

    try {
      const response = await fetch('/api/tts/energetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '안녕하세요! 이것은 AI 쇼츠 메이커의 음성 테스트입니다. 깨끗하고 명확한 한국어 음성이 잘 생성되는지 확인해보세요.',
          emotion: 'excited',
          intensity: 'medium',
          videoType: 'tutorial'
        })
      });

      const result = await response.json();
      if (result.success) {
        addResult({ 
          success: true, 
          message: 'TTS 음성 생성 성공',
          data: result.data,
          duration: result.data.duration 
        });
        
        // 생성된 음성 재생
        const audio = new Audio(result.data.audioUrl);
        audio.play();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      addResult({ 
        success: false, 
        message: 'TTS 음성 생성 실패', 
        error: error.message,
        duration: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  // 파일 업로드 테스트
  const testFileUpload = async () => {
    if (!testImages.length && !testAudio) {
      addResult({ 
        success: false, 
        message: '테스트할 파일을 선택해주세요', 
        error: '이미지 또는 음성 파일 필요',
        duration: 0 
      });
      return;
    }

    setLoading(true);
    addResult({ success: false, message: '파일 업로드 테스트 중...', duration: 0 });

    try {
      const formData = new FormData();
      
      testImages.forEach((file, index) => {
        formData.append('images', file);
      });
      
      if (testAudio) {
        formData.append('audio', testAudio);
      }

      const response = await fetch('/api/upload-temp-images', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        addResult({ 
          success: true, 
          message: `파일 업로드 성공 - 이미지: ${result.data.count}개${result.data.hasAudio ? ', 음성: 1개' : ''}`,
          data: result.data,
          duration: 0
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      addResult({ 
        success: false, 
        message: '파일 업로드 실패', 
        error: error.message,
        duration: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  // 전체 워크플로우 테스트
  const testFullWorkflow = async () => {
    setLoading(true);
    addResult({ success: false, message: '전체 워크플로우 테스트 시작...', duration: 0 });

    try {
      // 1. 샘플 이미지 생성
      await generateSampleImages();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. 스크립트 생성 (TTS 포함)
      const scriptResponse = await fetch('/api/scripts/generate-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseScript: {
            id: 'test_' + Date.now(),
            title: '테스트 비디오',
            description: '이것은 AI 쇼츠 메이커의 테스트 비디오입니다. 음성과 비디오가 잘 합성되는지 확인해보세요.',
            category: 'promotional',
            tags: ['test'],
            content: {
              narration: '안녕하세요! AI 쇼츠 메이커 테스트입니다.',
              scenes: []
            }
          },
          narrationSpeed: 'normal',
          videoStyle: 'promotional',
          generateAudio: testMode === 'tts',
          voiceStyle: 'energetic',
          emotion: 'excited',
          intensity: 'medium',
          useUploadedAudio: testMode === 'upload',
          uploadedAudioPath: testAudio ? '/temp-uploads/test-audio.mp3' : undefined
        })
      });

      const scriptResult = await scriptResponse.json();
      if (scriptResult.success) {
        addResult({ 
          success: true, 
          message: '스크립트 생성 완료',
          data: scriptResult.data,
          duration: scriptResult.data.totalDuration 
        });

        // 3. 비디오 렌더링 (현재는 스킵 - 시간이 오래 걸림)
        addResult({ 
          success: true, 
          message: '전체 워크플로우 테스트 완료 (비디오 렌더링 제외)',
          duration: 0 
        });
      } else {
        throw new Error(scriptResult.error);
      }
    } catch (error: any) {
      addResult({ 
        success: false, 
        message: '전체 워크플로우 테스트 실패', 
        error: error.message,
        duration: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  // 시스템 상태 확인
  const checkSystemHealth = async () => {
    setLoading(true);
    addResult({ success: false, message: '시스템 상태 확인 중...', duration: 0 });

    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      
      if (result.healthy) {
        addResult({ 
          success: true, 
          message: `시스템 상태: 정상 (${result.apis.filter((api: any) => api.valid).length}/${result.apis.length} API 활성)`,
          data: result,
          duration: 0 
        });
      } else {
        addResult({ 
          success: false, 
          message: '시스템 상태: 문제 발견',
          data: result,
          duration: 0 
        });
      }
    } catch (error: any) {
      addResult({ 
        success: false, 
        message: '시스템 상태 확인 실패', 
        error: error.message,
        duration: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  // 결과 초기화
  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TestTube className="w-6 h-6 text-blue-500" />
              AI 쇼츠 메이커 - 음성+비디오 테스트 환경
            </h1>
            <p className="text-gray-600 mt-2">
              음성 합성과 비디오 렌더링 기능을 테스트할 수 있는 환경입니다.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 테스트 컨트롤 */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">🧪 테스트 컨트롤</h2>
                  
                  {/* 테스트 모드 선택 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">테스트 모드</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTestMode('tts')}
                        className={`flex-1 p-2 rounded border-2 transition-all ${
                          testMode === 'tts' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <Mic className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-sm">TTS 생성</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setTestMode('upload')}
                        className={`flex-1 p-2 rounded border-2 transition-all ${
                          testMode === 'upload' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <Upload className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-sm">파일 업로드</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 파일 업로드 영역 */}
                  {testMode === 'upload' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">테스트 이미지</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setTestImages(Array.from(e.target.files || []))}
                          className="w-full p-2 border rounded"
                        />
                        {testImages.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {testImages.length}개 이미지 선택됨
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">테스트 음성</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setTestAudio(e.target.files?.[0] || null)}
                          className="w-full p-2 border rounded"
                        />
                        {testAudio && (
                          <p className="text-sm text-gray-600 mt-1">
                            {testAudio.name} ({(testAudio.size / 1024 / 1024).toFixed(1)}MB)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 테스트 버튼들 */}
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button
                      onClick={checkSystemHealth}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 p-3 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      <Settings className="w-4 h-4" />
                      시스템 체크
                    </button>
                    
                    <button
                      onClick={generateSampleImages}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      <FileImage className="w-4 h-4" />
                      샘플 이미지
                    </button>
                    
                    <button
                      onClick={testTTSGeneration}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                      TTS 테스트
                    </button>
                    
                    <button
                      onClick={testFileUpload}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 p-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      업로드 테스트
                    </button>
                    
                    <button
                      onClick={testFullWorkflow}
                      disabled={loading}
                      className="col-span-2 flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      전체 워크플로우 테스트
                    </button>
                  </div>

                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📖 사용 가이드 {showGuide ? '숨기기' : '보기'}
                    </button>
                    
                    <button
                      onClick={clearResults}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      🗑️ 결과 초기화
                    </button>
                  </div>
                </div>

                {/* 사용 가이드 */}
                {showGuide && (
                  <div>
                    <AudioGuide />
                  </div>
                )}
              </div>

              {/* 테스트 결과 */}
              <div>
                <h2 className="text-lg font-semibold mb-4">📊 테스트 결과</h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="text-gray-500">
                      테스트를 시작하면 결과가 여기에 표시됩니다...
                    </div>
                  ) : (
                    results.map((result, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                            [{new Date().toLocaleTimeString()}] {result.message}
                          </span>
                        </div>
                        
                        {result.error && (
                          <div className="ml-6 text-red-300 text-xs">
                            Error: {result.error}
                          </div>
                        )}
                        
                        {result.data && (
                          <div className="ml-6 text-gray-400 text-xs">
                            Data: {JSON.stringify(result.data, null, 2).substring(0, 200)}...
                          </div>
                        )}
                        
                        {result.duration && (
                          <div className="ml-6 text-blue-300 text-xs">
                            Duration: {result.duration}s
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}