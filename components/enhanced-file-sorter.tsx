// AI 정렬 + 수동 정렬 통합 컴포넌트

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Sparkles, FileImage, CheckCircle, Loader2 } from 'lucide-react';
import { ImageSorter, SortableImage } from '@/lib/image-sorter';
import { SortableImageList } from './sortable-image-list';

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}

export function EnhancedFileSorter() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [sortedFiles, setSortedFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectTitle, setProjectTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'ai' | 'manual'>('manual');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 파일 업로드 처리
  const handleFiles = useCallback((uploadedFiles: FileList | File[]) => {
    const newFiles = Array.from(uploadedFiles).filter(file => 
      file.type.startsWith('image/')
    ).map((file, index) => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      fileWithPreview.id = `${Date.now()}_${index}_${file.name}`;
      return fileWithPreview;
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setSortedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // AI 정렬 실행
  const handleAISort = async () => {
    if (files.length === 0 || !projectTitle.trim()) {
      setError('프로젝트 제목과 이미지를 추가해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('projectTitle', projectTitle);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/sort-files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 정렬에 실패했습니다.');
      }

      const result = await response.json();
      
      // AI 정렬 결과로 파일 순서 재배열
      const sortedFileMap = new Map(files.map(f => [f.name, f]));
      const newSortedFiles = result.data.sortedFiles.map((sortedFile: any) => 
        sortedFileMap.get(sortedFile.originalName)
      ).filter(Boolean);
      
      setSortedFiles(newSortedFiles as FileWithPreview[]);
      setProgress(100);
      
    } catch (err: any) {
      setError(err.message || '정렬 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 수동 정렬 결과 처리
  const handleManualSort = (sortedImages: SortableImage[]) => {
    const fileMap = new Map(files.map(f => [f.id, f]));
    const newSortedFiles = sortedImages
      .map(img => fileMap.get(img.id))
      .filter(Boolean) as FileWithPreview[];
    
    setSortedFiles(newSortedFiles);
  };

  // SortableImage 형식으로 변환
  const convertToSortableImages = (files: FileWithPreview[]): SortableImage[] => {
    return files.map((file, index) => ({
      id: file.id || '',
      path: file.preview || '',
      filename: file.name,
      fileSize: file.size,
      uploadTime: file.lastModified,
      index
    }));
  };

  // 영상 생성
  const handleCreateVideo = async () => {
    if (sortedFiles.length === 0) {
      setError('정렬된 이미지가 없습니다.');
      return;
    }

    // 비디오 생성 API 호출
    try {
      setIsProcessing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('projectTitle', projectTitle);
      
      sortedFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
      
      const response = await fetch('/api/videos/generate-script-video', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('비디오 생성에 실패했습니다.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        window.open(result.data.videoUrl, '_blank');
      } else {
        throw new Error(result.error || '비디오 생성 실패');
      }
      
    } catch (err: any) {
      setError(err.message || '비디오 생성 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>🎬 AI Shorts Maker - 이미지 정렬 및 영상 제작</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 프로젝트 제목 입력 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            프로젝트 제목
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="예: 우리 가족 여행"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 파일 업로드 영역 */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, GIF 형식 지원 (최대 50개)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* 업로드된 파일 수 표시 */}
        {files.length > 0 && (
          <Alert>
            <FileImage className="h-4 w-4" />
            <AlertDescription>
              {files.length}개의 이미지가 업로드되었습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 정렬 탭 */}
        {files.length > 0 && (
          <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">수동 정렬</TabsTrigger>
              <TabsTrigger value="ai">AI 자동 정렬</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4">
              <SortableImageList
                images={convertToSortableImages(sortedFiles)}
                onSortChange={handleManualSort}
                enableAISort={false}
              />
            </TabsContent>
            
            <TabsContent value="ai" className="mt-4">
              <div className="space-y-4">
                <Button
                  onClick={handleAISort}
                  disabled={isProcessing || !projectTitle.trim()}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI 정렬 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI로 자동 정렬하기
                    </>
                  )}
                </Button>
                
                {isProcessing && (
                  <Progress value={progress} className="w-full" />
                )}
                
                {/* AI 정렬된 이미지 표시 */}
                {sortedFiles.length > 0 && !isProcessing && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sortedFiles.map((file, index) => (
                      <div key={file.id} className="relative">
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-600 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* 에러 표시 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 영상 생성 버튼 */}
        {sortedFiles.length > 0 && (
          <Button
            onClick={handleCreateVideo}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                영상 생성 중...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                정렬된 순서로 영상 만들기
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}