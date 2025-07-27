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
    <div className="p-6 max-w-7xl mx-auto">
      {/* 상단 고정 헤더 및 컨트롤 */}
      <div className="sticky top-0 bg-gray-50 z-10 pb-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8" />
            지능형 파일 정렬
          </h1>
        </div>
        
        {/* 프로젝트 제목 및 주요 버튼들 - 항상 상단에 표시 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">프로젝트 제목</label>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="프로젝트 제목을 입력하세요"
              className="w-full"
            />
          </div>
          
          {/* 주요 액션 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {files.length > 0 && !isProcessing && sortedFiles.length === 0 && (
              <Button 
                onClick={handleSortFiles} 
                className="gap-2"
                size="lg"
                disabled={isProcessing}
              >
                <Brain className="w-5 h-5" />
                AI 지능형 정렬 시작
              </Button>
            )}
            
            {files.length > 0 && sortedFiles.length > 0 && (
              <Button
                onClick={handleSortFiles}
                variant="outline"
                className="gap-2"
                disabled={isProcessing}
              >
                <ArrowUpDown className="w-4 h-4" />
                재정렬
              </Button>
            )}
            
            {files.length > 0 && (
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                리셋
              </Button>
            )}
            
            {projectTitle && files.length > 0 && sortedFiles.length > 0 && (
              <Button 
                className="gap-2"
                onClick={() => setShowVideoRenderer(true)}
              >
                <Video className="w-5 h-5" />
                AI 영상 제작
              </Button>
            )}
          </div>
          
          {projectTitle && files.length > 0 && sortedFiles.length === 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>프로젝트:</strong> {projectTitle}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                정렬 완료 후 AI 영상 제작이 가능합니다.
              </p>
            </div>
          )}
        </div>
      </div>


      {/* 파일 업로드 영역 */}
      {files.length === 0 && (
        <Card className="mb-6">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">이미지 파일을 업로드하세요</h3>
              <p className="text-gray-600 mb-4">
                드래그 앤 드롭하거나 클릭하여 파일을 선택하세요 (최대 20개)
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
                <Button className="gap-2">
                  <FileImage className="w-4 h-4" />
                  파일 선택
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업로드된 파일 목록 */}
      {files.length > 0 && !isProcessing && sortedFiles.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              업로드된 파일 ({files.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
              {files.map((file, index) => {
                const imageUrl = URL.createObjectURL(file);
                return (
                  <div key={index} className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(imageUrl)}
                      />
                    </div>
                    <p className="text-xs truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)}KB
                    </p>
                  </div>
                );
              })}
            </div>
            {/* 파일 목록만 표시 - 버튼들은 상단 고정 영역에 있음 */}
          </CardContent>
        </Card>
      )}

      {/* 처리 중 상태 */}
      {isProcessing && (
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">{currentStep}</h3>
              <Progress value={progress} className="w-full max-w-md mx-auto mb-2" />
              <p className="text-sm text-gray-600">{progress}% 완료</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정렬 결과 */}
      {sortedFiles.length > 0 && report && (
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              정렬 결과
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Eye className="w-4 h-4" />
              분석 세부사항
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <Settings className="w-4 h-4" />
              정렬 리포트
            </TabsTrigger>
          </TabsList>

          {/* 정렬 결과 탭 */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  최종 정렬 순서
                  <Badge variant="outline">
                    신뢰도: {Math.round(report.confidenceScore * 100)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedFiles.map((file, index) => {
                    // 이미지 미리보기를 위한 URL 생성
                    const originalFile = files.find(f => f.name === file.filename);
                    const imageUrl = originalFile ? URL.createObjectURL(originalFile) : null;
                    
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        {/* 이미지 미리보기 */}
                        {imageUrl && (
                          <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{maxHeight: '150px'}}>
                            <img 
                              src={imageUrl} 
                              alt={file.filename}
                              className="w-full h-full object-cover"
                              style={{maxHeight: '150px'}}
                              onLoad={() => URL.revokeObjectURL(imageUrl)}
                            />
                          </div>
                        )}
                        
                        {/* 순서 번호와 변경 표시 */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          {file.originalIndex !== index && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <ArrowUpDown className="w-4 h-4" />
                              <span className="text-xs">
                                {file.originalIndex + 1} → {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* 파일 정보 */}
                        <div>
                          <h4 className="font-medium text-sm truncate" title={file.filename}>
                            {file.filename}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {file.sortingReasons.slice(0, 2).map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* 신뢰도 */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500">
                            신뢰도: {Math.round(file.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 세부사항 탭 */}
          <TabsContent value="analysis">
            <div className="grid gap-6">
              {sortedFiles.map((file, index) => {
                const originalFile = files.find(f => f.name === file.filename);
                const imageUrl = originalFile ? URL.createObjectURL(originalFile) : null;
                
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        {file.filename}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* 이미지 미리보기 */}
                        {imageUrl && (
                          <div className="md:col-span-1">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              이미지 미리보기
                            </h4>
                            <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{maxHeight: '200px'}}>
                              <img 
                                src={imageUrl} 
                                alt={file.filename}
                                className="w-full h-full object-cover"
                                style={{maxHeight: '200px'}}
                                onLoad={() => URL.revokeObjectURL(imageUrl)}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className={imageUrl ? "md:col-span-2 grid md:grid-cols-2 gap-4" : "grid md:grid-cols-2 gap-4"}>
                      {/* 파일명 분석 */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          파일명 분석
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>패턴:</strong> {file.metadata.pattern}</div>
                          {file.metadata.extractedDate && (
                            <div><strong>추출된 날짜:</strong> {new Date(file.metadata.extractedDate).toLocaleString()}</div>
                          )}
                          <div><strong>신뢰도:</strong> {Math.round(file.metadata.confidence * 100)}%</div>
                        </div>
                      </div>

                      {/* 이미지 분석 */}
                      {file.imageAnalysis && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            AI 이미지 분석
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>장면:</strong> {file.imageAnalysis.scene}</div>
                            {file.imageAnalysis.timeOfDay && (
                              <div><strong>시간대:</strong> {file.imageAnalysis.timeOfDay}</div>
                            )}
                            <div><strong>배경:</strong> {file.imageAnalysis.setting}</div>
                            <div><strong>순서 추정:</strong> {file.imageAnalysis.sequenceHints.chronologicalOrder}/10</div>
                            <div><strong>AI 신뢰도:</strong> {Math.round(file.imageAnalysis.confidence * 100)}%</div>
                          </div>
                        </div>
                      )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* 정렬 리포트 탭 */}
          <TabsContent value="report">
            <div className="grid gap-6">
              {/* 전체 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle>정렬 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{report.totalFiles}</div>
                      <div className="text-sm text-gray-600">총 파일 수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(report.processingTime / 1000)}s
                      </div>
                      <div className="text-sm text-gray-600">처리 시간</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(report.confidenceScore * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">전체 신뢰도</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {report.adjustments.fromFilename + report.adjustments.fromImageAnalysis}
                      </div>
                      <div className="text-sm text-gray-600">순서 조정</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 추천사항 */}
              {report.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      개선 추천사항
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.recommendations.map((rec, index) => (
                        <Alert key={index}>
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* 비디오 렌더링 모달 */}
      {showVideoRenderer && projectTitle && sortedFiles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">AI 영상 제작</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowVideoRenderer(false)}
                >
                  닫기
                </Button>
              </div>
              
              <VideoRendererWithUpload
                sortedFiles={sortedFiles}
                originalFiles={files}
                projectTitle={projectTitle}
                onRenderComplete={(result) => {
                  console.log('비디오 렌더링 완료:', result);
                  // 렌더링 완료 후 모달 닫기 여부를 사용자가 결정하도록 함
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}