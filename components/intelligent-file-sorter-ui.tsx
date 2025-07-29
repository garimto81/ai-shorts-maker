// React 컴포넌트: 지능형 파일 정렬 UI

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Clock,
  Brain,
  FileImage,
  ArrowUpDown,
  Download,
  Settings,
  Play,
  Video
} from 'lucide-react';
import VideoRendererWithUpload from './video-renderer-with-upload';

interface SortedFileData {
  filename: string;
  originalIndex: number;
  finalIndex: number;
  confidence: number;
  sortingReasons: string[];
  metadata: {
    extractedDate?: string;
    pattern: string;
    confidence: number;
  };
  imageAnalysis: {
    scene: string;
    timeOfDay?: string;
    setting: string;
    sequenceHints: {
      isBeginning: number;
      isMiddle: number;
      isEnding: number;
      chronologicalOrder: number;
    };
    confidence: number;
  } | null;
}

interface SortingReport {
  totalFiles: number;
  processingTime: number;
  sortingMethod: string;
  confidenceScore: number;
  adjustments: {
    fromFilename: number;
    fromImageAnalysis: number;
    conflictResolutions: number;
  };
  recommendations: string[];
}

export default function IntelligentFileSorterUI() {
  const [files, setFiles] = useState<File[]>([]);
  const [sortedFiles, setSortedFiles] = useState<SortedFileData[]>([]);
  const [report, setReport] = useState<SortingReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [showVideoRenderer, setShowVideoRenderer] = useState(false);

  // 이미지 리사이징 함수
  const resizeImage = (file: File, maxWidth: number = 150, maxHeight: number = 150): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 원본 비율 유지하면서 리사이징
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            });
            resolve(resizedFile);
          } else {
            resolve(file); // 리사이징 실패시 원본 반환
          }
        }, file.type, 0.8); // 품질 80%
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 파일 드래그 앤 드롭 처리
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      setCurrentStep('이미지 리사이징 중...');
      setIsProcessing(true);
      
      try {
        const resizedFiles = await Promise.all(
          droppedFiles.map(file => resizeImage(file))
        );
        setFiles(resizedFiles);
      } catch (error) {
        console.error('이미지 리사이징 오류:', error);
        setFiles(droppedFiles); // 실패시 원본 사용
      } finally {
        setIsProcessing(false);
        setCurrentStep('');
      }
    }
  }, []);

  // 파일 선택 처리
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 0) {
      setCurrentStep('이미지 리사이징 중...');
      setIsProcessing(true);
      
      try {
        const resizedFiles = await Promise.all(
          selectedFiles.map(file => resizeImage(file))
        );
        setFiles(resizedFiles);
      } catch (error) {
        console.error('이미지 리사이징 오류:', error);
        setFiles(selectedFiles); // 실패시 원본 사용
      } finally {
        setIsProcessing(false);
        setCurrentStep('');
      }
    }
  };

  // 파일 정렬 실행
  const handleSortFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setSortedFiles([]);
    setReport(null);

    try {
      // FormData 구성
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // 진행률 시뮬레이션
      const progressSteps = [
        { step: '파일 업로드 중...', progress: 10 },
        { step: '파일명 분석 중...', progress: 30 },
        { step: 'AI 이미지 분석 중...', progress: 70 },
        { step: '순서 최적화 중...', progress: 90 },
        { step: '완료', progress: 100 }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setCurrentStep(progressSteps[stepIndex].step);
          setProgress(progressSteps[stepIndex].progress);
          stepIndex++;
        }
      }, 1000);

      // API 호출
      const response = await fetch('/api/sort-files', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('파일 정렬 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        setSortedFiles(result.data.sortedFiles);
        setReport(result.data.report);
        setProgress(100);
        setCurrentStep('정렬 완료!');
      } else {
        throw new Error(result.error || '정렬 실패');
      }

    } catch (error: any) {
      console.error('정렬 오류:', error);
      alert(`정렬 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 수동 순서 조정
  const handleManualAdjust = (fromIndex: number, toIndex: number) => {
    const newSortedFiles = [...sortedFiles];
    const [movedFile] = newSortedFiles.splice(fromIndex, 1);
    newSortedFiles.splice(toIndex, 0, movedFile);
    
    // finalIndex 업데이트
    const updatedFiles = newSortedFiles.map((file, index) => ({
      ...file,
      finalIndex: index,
      sortingReasons: [...file.sortingReasons, '사용자 수동 조정']
    }));
    
    setSortedFiles(updatedFiles);
  };

  // 리셋
  const handleReset = () => {
    setFiles([]);
    setSortedFiles([]);
    setReport(null);
    setProgress(0);
    setCurrentStep('');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto p-6">
        {/* 상단 헤더 - 글라스모피즘 스타일 */}
        <div className="sticky top-0 z-10 pb-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">3단계 하이브리드 AI 정렬</h1>
                  <p className="text-blue-200">실제 이미지 내용을 분석하여 완벽한 순서 정렬</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">AI 준비 완료</span>
              </div>
            </div>
            
            {/* 프로젝트 제목 입력 */}
            <div className="space-y-3">
              <label className="text-white font-medium flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                프로젝트 제목
              </label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="예: 여행 영상 프로젝트, 제품 소개 영상 등..."
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 backdrop-blur-sm h-12 text-lg"
              />
            </div>
            
            {/* 주요 액션 버튼들 */}
            <div className="flex flex-wrap gap-3 mt-6">
              {files.length > 0 && !isProcessing && sortedFiles.length === 0 && (
                <Button 
                  onClick={handleSortFiles} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-6 py-3 h-auto text-lg font-semibold rounded-xl shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                  disabled={isProcessing}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  🚀 3단계 하이브리드 AI 정렬 시작
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {files.length > 0 && sortedFiles.length > 0 && (
                <Button
                  onClick={handleSortFiles}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  disabled={isProcessing}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  재정렬
                </Button>
              )}
              
              {files.length > 0 && (
                <Button 
                  onClick={handleReset} 
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  리셋
                </Button>
              )}
              
              {projectTitle && files.length > 0 && sortedFiles.length > 0 && (
                <Button 
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 px-6 py-3 h-auto text-lg font-semibold rounded-xl shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105"
                  onClick={() => setShowVideoRenderer(true)}
                >
                <Video className="w-5 h-5" />
                AI 영상 제작
              </Button>
            )}
            </div>
            
            {projectTitle && files.length > 0 && sortedFiles.length === 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-300/30 backdrop-blur-sm">
                <p className="text-white font-semibold">
                  📽️ <strong>프로젝트:</strong> {projectTitle}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  정렬 완료 후 AI 영상 제작이 가능합니다.
                </p>
              </div>
            )}
          </div>
        </div>


        {/* 파일 업로드 영역 - 글라스모피즘 스타일 */}
        {files.length === 0 && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div
                className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-500/20 scale-105' 
                    : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  🎬 이미지 파일을 업로드하세요
                </h3>
                <p className="text-blue-200 mb-6 text-lg">
                  드래그 앤 드롭하거나 클릭하여 파일을 선택하세요<br />
                  <span className="text-sm opacity-75">(최대 20개, JPG/PNG/GIF 지원)</span>
                </p>
                
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <FileImage className="w-5 h-5 mr-2" />
                    📂 파일 선택하기
                  </Button>
                </label>
                
                <div className="mt-6 flex justify-center space-x-4 text-sm text-blue-200">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>AI 분석 준비됨</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>실시간 처리</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 업로드된 파일 목록 - 글라스모피즘 스타일 */}
        {files.length > 0 && !isProcessing && sortedFiles.length === 0 && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">업로드 완료</h3>
                    <p className="text-blue-200">{files.length}개 파일 분석 대기 중</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-sm font-medium">준비 완료</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {files.map((file, index) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div 
                      key={index} 
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                    >
                      <div className="relative">
                        <div className="w-full aspect-square bg-white/10 rounded-xl mb-2 overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onLoad={() => URL.revokeObjectURL(imageUrl)}
                          />
                        </div>
                        <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-xs text-white truncate font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-blue-200">
                        {Math.round(file.size / 1024)}KB
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-300/30">
                <div className="flex items-center gap-2 text-yellow-200">
                  <Brain className="w-5 h-5" />
                  <span className="font-semibold">3단계 하이브리드 AI 분석 준비됨</span>
                </div>
                <p className="text-sm text-yellow-100 mt-1 ml-7">
                  파일명 분석 → 실제 이미지 내용 분석 → 최적화 순서로 진행됩니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 처리 중 상태 - 애니메이션 강화 */}
        {isProcessing && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-spin">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-900 to-purple-900 rounded-full flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{currentStep}</h3>
                <p className="text-blue-200 mb-6">AI가 실제 이미지 내용을 분석하고 있습니다...</p>
                
                {/* 진행률 바 - 그라디언트 스타일 */}
                <div className="relative w-full max-w-lg mx-auto mb-4">
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center items-center space-x-6 text-sm text-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <span>{progress}% 완료</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
                    <span>AI 분석 중</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-400"></div>
                    <span>3단계 처리</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 정렬 결과 - 현대적 탭 디자인 */}
        {sortedFiles.length > 0 && report && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">✨ 3단계 하이브리드 AI 정렬 완료</h2>
                    <p className="text-green-200">실제 이미지 내용 분석을 통한 완벽한 순서 정렬</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-300">
                    {Math.round(report.confidenceScore * 100)}%
                  </div>
                  <div className="text-sm text-green-200">신뢰도</div>
                </div>
              </div>
              
              <Tabs defaultValue="results" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20">
                  <TabsTrigger 
                    value="results" 
                    className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-blue-200 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4" />
                    정렬 결과
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis" 
                    className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-blue-200 rounded-xl"
                  >
                    <Eye className="w-4 h-4" />
                    AI 분석 세부사항
                  </TabsTrigger>
                  <TabsTrigger 
                    value="report" 
                    className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-blue-200 rounded-xl"
                  >
                    <Settings className="w-4 h-4" />
                    정렬 리포트
                  </TabsTrigger>
                </TabsList>

                {/* 정렬 결과 탭 */}
                <TabsContent value="results" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedFiles.map((file, index) => {
                      // 이미지 미리보기를 위한 URL 생성
                      const originalFile = files.find(f => f.name === file.filename);
                      const imageUrl = originalFile ? URL.createObjectURL(originalFile) : null;
                      
                      return (
                        <div 
                          key={index} 
                          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
                        >
                          {/* 이미지 미리보기 */}
                          {imageUrl && (
                            <div className="relative w-full aspect-video bg-white/10 rounded-xl overflow-hidden mb-4">
                              <img 
                                src={imageUrl} 
                                alt={file.filename}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onLoad={() => URL.revokeObjectURL(imageUrl)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                          )}
                          
                          {/* 순서 번호와 변경 표시 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                                {index + 1}
                              </div>
                              {file.originalIndex !== index && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-200 rounded-lg border border-orange-300/30">
                                  <ArrowUpDown className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {file.originalIndex + 1} → {index + 1}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-300">
                                {Math.round(file.confidence * 100)}%
                              </div>
                              <div className="text-xs text-green-200">신뢰도</div>
                            </div>
                          </div>
                          
                          {/* 파일 정보 */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-white text-sm truncate" title={file.filename}>
                              {file.filename}
                            </h4>
                            
                            {/* AI 분석 결과 요약 */}
                            <div className="space-y-2">
                              {file.sortingReasons?.slice(0, 2).map((reason, reasonIndex) => (
                                <div key={reasonIndex} className="text-xs text-blue-200 bg-white/5 rounded-lg p-2 border border-white/10">
                                  {reason}
                                </div>
                              ))}
                            </div>
                            
                            {/* 메타데이터 */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-blue-200">
                                패턴: <span className="text-white font-medium">{file.metadata?.pattern || 'N/A'}</span>
                              </div>
                              <div className="text-blue-200">
                                유형: <span className="text-white font-medium">
                                  {file.imageAnalysis ? 'AI 분석' : '파일명'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                {/* AI 분석 세부사항 탭 */}
                <TabsContent value="analysis" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-300/30">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-6 h-6" />
                        3단계 하이브리드 AI 분석 결과
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-300">{report.adjustments?.fromFilename || 0}</div>
                          <div className="text-sm text-blue-200">파일명 패턴 분석</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-300">{report.adjustments?.fromFilenameAI || 0}</div>
                          <div className="text-sm text-purple-200">AI 파일명 분석</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-300">{report.adjustments?.fromImageContent || 0}</div>
                          <div className="text-sm text-green-200">실제 이미지 내용 분석</div>
                        </div>
                      </div>
                    </div>
                    
                    {sortedFiles.map((file, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold text-white">{file.filename}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-blue-200 mb-2">📋 AI 분석 근거:</h5>
                            <div className="space-y-1">
                              {file.sortingReasons?.map((reason, reasonIndex) => (
                                <div key={reasonIndex} className="text-sm text-white bg-white/5 rounded-lg p-2 border border-white/10">
                                  {reason}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {file.imageAnalysis && (
                            <div>
                              <h5 className="text-sm font-medium text-purple-200 mb-2">🎬 이미지 분석:</h5>
                              <div className="grid md:grid-cols-2 gap-3 text-sm">
                                <div className="text-blue-200">
                                  장면: <span className="text-white">{file.imageAnalysis.scene}</span>
                                </div>
                                <div className="text-blue-200">
                                  설정: <span className="text-white">{file.imageAnalysis.setting}</span>
                                </div>
                                {file.imageAnalysis.timeOfDay && (
                                  <div className="text-blue-200">
                                    시간: <span className="text-white">{file.imageAnalysis.timeOfDay}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                {/* 정렬 리포트 탭 */}
                <TabsContent value="report" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          처리 성능
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-200">총 파일 수:</span>
                            <span className="text-white font-medium">{report.totalFiles}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">처리 시간:</span>
                            <span className="text-white font-medium">{report.processingTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">정렬 방법:</span>
                            <span className="text-white font-medium">{report.sortingMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">전체 신뢰도:</span>
                            <span className="text-green-300 font-bold">{Math.round(report.confidenceScore * 100)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          분석 세부사항
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-200">파일명 분석:</span>
                            <span className="text-white font-medium">{report.adjustments?.fromFilename || 0}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">AI 파일명 분석:</span>
                            <span className="text-white font-medium">{report.adjustments?.fromFilenameAI || 0}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">이미지 내용 분석:</span>
                            <span className="text-white font-medium">{report.adjustments?.fromImageContent || 0}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">보조 이미지 분석:</span>
                            <span className="text-white font-medium">{report.adjustments?.fromImageAnalysis || 0}개</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {report.recommendations && report.recommendations.length > 0 && (
                      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-6 border border-green-300/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          AI 추천사항
                        </h3>
                        <div className="space-y-2">
                          {report.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-3 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-green-100">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
        
        {/* 비디오 렌더러 */}
        {showVideoRenderer && projectTitle && sortedFiles.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">🎬 AI 영상 제작</h2>
                    <p className="text-pink-200">정렬된 이미지로 고품질 영상을 제작합니다</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowVideoRenderer(false)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-xl"
                >
                  닫기
                </Button>
              </div>
              
              <VideoRendererWithUpload
                preloadedFiles={sortedFiles.map(sf => {
                  const originalFile = files.find(f => f.name === sf.filename);
                  return originalFile!;
                })}
                projectTitle={projectTitle}
              />
            </div>
          </div>
        )}
        
        {/* 추가 CSS 애니메이션 */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          
          .animation-delay-200 {
            animation-delay: 200ms;
          }
          
          .animation-delay-400 {
            animation-delay: 400ms;
          }
        `}</style>
      </div>
    </div>
  );
}