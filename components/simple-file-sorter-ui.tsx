// 단순화된 파일 정렬 UI (파일명 기준)

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  RotateCcw, 
  FileImage,
  Play,
  X,
  FolderOpen,
  AlertTriangle
} from 'lucide-react';
import { SimpleFileSorter } from '@/lib/simple-file-sorter';
import AIScriptGenerator, { VideoScript } from './ai-script-generator';
import ScriptPreview from './script-preview';
import VideoRendererWithUpload from './video-renderer-with-upload';

interface SortedFile {
  file: File;
  originalName: string;
  sortedIndex: number;
  size: number;
  type: string;
  thumbnail?: string;
}

type SortMode = 'desc' | 'asc' | 'ai' | 'manual';

export default function SimpleFileSorterUI() {
  const [files, setFiles] = useState<File[]>([]);
  const [sortedFiles, setSortedFiles] = useState<SortedFile[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'title' | 'script' | 'preview' | 'video'>('upload');
  const [generatedScript, setGeneratedScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('desc');
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]); // 이미지 분석용 업로드된 경로들

  // 파일 검증
  const validateFiles = (fileList: FileList | File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 20;

    const filesArray = Array.from(fileList);
    const errors: string[] = [];

    if (filesArray.length > maxFiles) {
      errors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
    }

    const validFiles = filesArray.filter(file => {
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        return false;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: 파일 크기가 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });

    return { validFiles, errors };
  };

  // 썸네일 생성
  const createThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        const aspectRatio = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > 1) {
          drawHeight = size / aspectRatio;
          offsetY = (size - drawHeight) / 2;
        } else {
          drawWidth = size * aspectRatio;
          offsetX = (size - drawWidth) / 2;
        }
        
        ctx!.fillStyle = '#f5f5f5';
        ctx!.fillRect(0, 0, size, size);
        ctx!.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          }
        }, 'image/jpeg', 0.7);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // 정렬 함수들
  const sortFiles = useCallback((files: File[], mode: SortMode) => {
    switch (mode) {
      case 'desc':
        return SimpleFileSorter.sortFilesByNameDesc(files);
      case 'asc':
        return [...files].sort((a, b) => 
          a.name.localeCompare(b.name, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );
      case 'ai':
      case 'manual':
        return files; // AI 분석이나 수동 정렬의 경우 현재 순서 유지
      default:
        return files;
    }
  }, []);

  // 정렬 모드 변경
  const handleSortModeChange = useCallback(async (newMode: SortMode) => {
    setSortMode(newMode);
    
    if (newMode === 'manual') {
      // 수동 정렬 모드에서는 현재 순서 유지
      return;
    }
    
    if (newMode === 'ai') {
      // AI 분석 정렬 (향후 구현)
      setError('AI 분석 정렬은 곧 구현될 예정입니다.');
      return;
    }
    
    // 파일 재정렬
    const sorted = sortFiles(files, newMode);
    setFiles(sorted);
    
    // 정렬된 파일 정보 재생성
    const sortedFileData = await Promise.all(
      sorted.map(async (file, index) => {
        // 기존 썸네일 찾기
        const existingFile = sortedFiles.find(sf => sf.file.name === file.name);
        const thumbnail = existingFile?.thumbnail || await createThumbnail(file);
        
        return {
          file,
          originalName: file.name,
          sortedIndex: index,
          size: file.size,
          type: file.type,
          thumbnail
        };
      })
    );
    
    setSortedFiles(sortedFileData);
  }, [files, sortedFiles, sortFiles, createThumbnail]);

  // 수동 파일 순서 변경
  const moveFile = useCallback((fromIndex: number, toIndex: number) => {
    if (sortMode !== 'manual') return;
    
    const newFiles = [...files];
    const newSortedFiles = [...sortedFiles];
    
    // 파일 이동
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    
    const [movedSortedFile] = newSortedFiles.splice(fromIndex, 1);
    newSortedFiles.splice(toIndex, 0, movedSortedFile);
    
    // 인덱스 업데이트
    newSortedFiles.forEach((file, index) => {
      file.sortedIndex = index;
    });
    
    setFiles(newFiles);
    setSortedFiles(newSortedFiles);
  }, [files, sortedFiles, sortMode]);

  // 파일 추가 시 자동 정렬 및 썸네일 생성
  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const allFiles = [...files, ...newFiles];
    const sorted = sortFiles(allFiles, sortMode);
    setFiles(sorted);

    // 정렬된 파일 정보 생성
    const sortedFileData = await Promise.all(
      sorted.map(async (file, index) => {
        const thumbnail = await createThumbnail(file);
        return {
          file,
          originalName: file.name,
          sortedIndex: index,
          size: file.size,
          type: file.type,
          thumbnail
        };
      })
    );

    setSortedFiles(sortedFileData);
    if (currentStep === 'upload') {
      setCurrentStep('title');
    }
  }, [files, createThumbnail, currentStep, sortFiles, sortMode]);

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    const { validFiles, errors } = validateFiles(droppedFiles);
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    handleFilesAdded(validFiles);
  }, [handleFilesAdded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // 파일 선택
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const { validFiles, errors } = validateFiles(selectedFiles);
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    handleFilesAdded(validFiles);
  }, [handleFilesAdded]);

  // 파일 제거
  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newSortedFiles = sortedFiles.filter((_, i) => i !== index);
    
    // 썸네일 URL 정리
    if (sortedFiles[index]?.thumbnail) {
      URL.revokeObjectURL(sortedFiles[index].thumbnail!);
    }
    
    setFiles(newFiles);
    setSortedFiles(newSortedFiles);
    
    if (newFiles.length === 0) {
      setCurrentStep('upload');
      setProjectTitle('');
      setGeneratedScript(null);
    }
  }, [files, sortedFiles]);

  // 전체 리셋
  const handleReset = useCallback(() => {
    // 썸네일 URL 정리
    sortedFiles.forEach(file => {
      if (file.thumbnail) {
        URL.revokeObjectURL(file.thumbnail);
      }
    });
    
    setFiles([]);
    setSortedFiles([]);
    setProjectTitle('');
    setCurrentStep('upload');
    setGeneratedScript(null);
    setError(null);
  }, [sortedFiles]);

  // 프로젝트 제목 제출 및 이미지 업로드
  const handleTitleSubmit = async () => {
    if (!projectTitle.trim() || files.length === 0) return;
    
    try {
      setError(null);
      console.log('📤 이미지 업로드 시작...');
      
      // FormData 구성 - 정렬된 순서대로
      const formData = new FormData();
      
      for (let i = 0; i < sortedFiles.length; i++) {
        const sortedFile = sortedFiles[i];
        // 정렬된 순서에 맞게 파일명을 조정
        const renamedFile = new File([sortedFile.file], `sorted_${i + 1}_${sortedFile.file.name}`, {
          type: sortedFile.file.type,
          lastModified: sortedFile.file.lastModified
        });
        formData.append('images', renamedFile);
      }

      // 서버에 업로드
      const response = await fetch('/api/upload-temp-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedImagePaths(result.data.imagePaths);
        console.log('✅ 이미지 업로드 완료:', result.data.imagePaths);
        setCurrentStep('script');
      } else {
        throw new Error(result.error || '이미지 업로드 실패');
      }

    } catch (error: any) {
      console.error('❌ 이미지 업로드 오류:', error);
      setError(`이미지 업로드 실패: ${error.message}`);
      // 업로드 실패해도 기존 방식으로 진행
      setCurrentStep('script');
    }
  };

  // 스크립트 생성 완료
  const handleScriptGenerated = (script: VideoScript) => {
    setGeneratedScript(script);
    setCurrentStep('preview');
  };

  // 비디오 제작
  const handleCreateVideo = () => {
    setCurrentStep('video');
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      sortedFiles.forEach(file => {
        if (file.thumbnail) {
          URL.revokeObjectURL(file.thumbnail);
        }
      });
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {files.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: 파일 업로드 */}
      {currentStep === 'upload' && (
        <div
          className={`border-2 border-dashed rounded p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button>파일 선택</Button>
          </label>
        </div>
      )}

      {/* 정렬 옵션 버튼들 */}
      {files.length > 0 && currentStep !== 'video' && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sortMode === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('desc')}
            >
              내림차순
            </Button>
            <Button
              variant={sortMode === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('asc')}
            >
              오름차순
            </Button>
            <Button
              variant={sortMode === 'ai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('ai')}
            >
              AI 분석
            </Button>
            <Button
              variant={sortMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('manual')}
            >
              직접 수정
            </Button>
          </div>
        </div>
      )}

      {/* 이미지 카드 박스 */}
      {files.length > 0 && currentStep !== 'video' && (
        <div className="mb-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedFiles.map((sortedFile, index) => (
                <div 
                  key={index} 
                  className="relative"
                  draggable={sortMode === 'manual'}
                  onDragStart={(e) => {
                    if (sortMode === 'manual') {
                      e.dataTransfer.setData('text/plain', index.toString());
                    }
                  }}
                  onDragOver={(e) => {
                    if (sortMode === 'manual') {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    if (sortMode === 'manual') {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      moveFile(fromIndex, index);
                    }
                  }}
                >
                  <div className="aspect-square rounded overflow-hidden bg-white border">
                    {sortedFile.thumbnail ? (
                      <img
                        src={sortedFile.thumbnail}
                        alt={sortedFile.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* 순서 번호 */}
                  <div className="absolute top-1 left-1 bg-black text-white px-1.5 py-0.5 rounded text-xs font-medium">
                    {index + 1}
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    title="파일 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  {/* 수동 정렬 핸들 */}
                  {sortMode === 'manual' && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white px-1 rounded text-xs cursor-move" title="드래그하여 순서 변경">
                      ⋮⋮
                    </div>
                  )}
                  
                  {/* 파일명 표시 */}
                  <div className="mt-1 text-xs text-gray-600 truncate" title={sortedFile.originalName}>
                    {sortedFile.originalName}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 파일 개수 및 정렬 정보 */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
              <span>총 {files.length}개 파일</span>
              <span>
                {sortMode === 'desc' && '파일명 내림차순'}
                {sortMode === 'asc' && '파일명 오름차순'}
                {sortMode === 'ai' && 'AI 분석 정렬'}
                {sortMode === 'manual' && '수동 정렬'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 프로젝트 제목 입력 */}
      {currentStep === 'title' && (
        <div className="space-y-4">
          <Input
            placeholder="제목"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTitleSubmit()}
          />
          <Button 
            onClick={handleTitleSubmit}
            disabled={!projectTitle.trim()}
            className="w-full"
          >
            다음
          </Button>
        </div>
      )}

      {/* Step 3: AI 스크립트 생성 */}
      {currentStep === 'script' && (
        <AIScriptGenerator
          projectTitle={projectTitle}
          sortedFiles={files}
          uploadedImagePaths={uploadedImagePaths.length > 0 ? uploadedImagePaths : undefined}
          onScriptGenerated={handleScriptGenerated}
        />
      )}

      {/* Step 4: 스크립트 미리보기 */}
      {currentStep === 'preview' && generatedScript && (
        <ScriptPreview
          script={generatedScript}
          onCreateVideo={handleCreateVideo}
        />
      )}

      {/* Step 5: 비디오 제작 */}
      {currentStep === 'video' && generatedScript && (
        <VideoRendererWithUpload
          sortedFiles={sortedFiles.map(sf => ({ 
            filename: sf.originalName,
            originalIndex: sf.sortedIndex,
            finalIndex: sf.sortedIndex,
            confidence: 1.0,
            sortingReasons: [`${sortMode} 정렬`]
          }))}
          originalFiles={files}
          projectTitle={projectTitle}
          script={generatedScript}
        />
      )}
    </div>
  );
}