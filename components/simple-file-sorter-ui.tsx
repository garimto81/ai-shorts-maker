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

type SortMode = 'desc' | 'asc' | 'manual' | 'number';

export default function SimpleFileSorterUI() {
  const [files, setFiles] = useState<File[]>([]);
  const [sortedFiles, setSortedFiles] = useState<SortedFile[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [isInitialSort, setIsInitialSort] = useState(true);
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
        return SimpleFileSorter.sortFilesByNameAsc(files);
      case 'manual':
      case 'number':
        return files; // 수동 정렬 및 번호 입력의 경우 현재 순서 유지
      default:
        return files;
    }
  }, []);

  // 정렬 모드 변경
  const handleSortModeChange = useCallback(async (newMode: SortMode) => {
    setSortMode(newMode);
    
    if (newMode === 'manual' || newMode === 'number') {
      // 수동 정렬 모드에서는 현재 순서 유지
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
    if (sortMode !== 'manual' && sortMode !== 'number') return;
    
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

  // 번호 입력으로 순서 변경
  const handleNumberInput = useCallback((fileIndex: number, newPosition: string) => {
    const position = parseInt(newPosition);
    if (isNaN(position) || position < 1 || position > files.length) return;
    
    const targetIndex = position - 1;
    if (fileIndex === targetIndex) return;
    
    moveFile(fileIndex, targetIndex);
  }, [files.length, moveFile]);

  // 파일 추가 시 자동 정렬 및 썸네일 생성
  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const allFiles = [...files, ...newFiles];
    // 초기 업로드 시에는 현재 정렬 모드로 정렬
    const sorted = isInitialSort ? sortFiles(allFiles, sortMode) : allFiles;
    setFiles(sorted);
    setIsInitialSort(false);

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
      {/* Version indicator for debugging */}
      <div className="text-xs text-gray-400 text-center mb-2">v2.0.1 - 정렬 기능 포함</div>
      
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
          <div className="mb-4">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              이미지 파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <p className="text-xs text-gray-500 mt-1">
              지원 형식: JPG, PNG, GIF, WebP (최대 20개)
            </p>
          </div>
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
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-medium text-gray-700">정렬 방식:</span>
            <Button
              variant={sortMode === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('desc')}
            >
              파일명 내림차순 (Z→A)
            </Button>
            <Button
              variant={sortMode === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('asc')}
            >
              파일명 오름차순 (A→Z)
            </Button>
            <Button
              variant={sortMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('manual')}
            >
              드래그로 순서 변경
            </Button>
            <Button
              variant={sortMode === 'number' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('number')}
            >
              번호 직접 입력
            </Button>
          </div>
          {sortMode === 'manual' && (
            <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded p-2">
              💡 이미지를 드래그하여 순서를 변경할 수 있습니다.
            </div>
          )}
          {sortMode === 'number' && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 rounded p-2">
              🔢 각 이미지의 번호를 직접 입력하여 순서를 변경할 수 있습니다. (1부터 {files.length}까지)
            </div>
          )}
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
                  className={`relative ${
                    sortMode === 'manual' 
                      ? 'cursor-move hover:shadow-lg transition-shadow duration-200' 
                      : ''
                  }`}
                  draggable={sortMode === 'manual'}
                  onDragStart={(e) => {
                    if (sortMode === 'manual') {
                      e.dataTransfer.setData('text/plain', index.toString());
                      e.dataTransfer.effectAllowed = 'move';
                      // 드래그 중인 이미지에 투명도 적용
                      const target = e.currentTarget as HTMLElement;
                      target.style.opacity = '0.5';
                    }
                  }}
                  onDragEnd={(e) => {
                    // 드래그 종료 시 투명도 복원
                    const target = e.currentTarget as HTMLElement;
                    target.style.opacity = '1';
                  }}
                  onDragOver={(e) => {
                    if (sortMode === 'manual') {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDragEnter={(e) => {
                    if (sortMode === 'manual') {
                      // 드롭 영역에 들어왔을 때 하이라이트
                      const target = e.currentTarget as HTMLElement;
                      target.classList.add('border-2', 'border-blue-500');
                    }
                  }}
                  onDragLeave={(e) => {
                    if (sortMode === 'manual') {
                      // 드롭 영역을 떠났을 때 하이라이트 제거
                      const target = e.currentTarget as HTMLElement;
                      target.classList.remove('border-2', 'border-blue-500');
                    }
                  }}
                  onDrop={(e) => {
                    if (sortMode === 'manual') {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      const target = e.currentTarget as HTMLElement;
                      target.classList.remove('border-2', 'border-blue-500');
                      if (fromIndex !== index) {
                        moveFile(fromIndex, index);
                      }
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
                  {sortMode === 'number' ? (
                    <input
                      type="number"
                      min="1"
                      max={files.length}
                      value={index + 1}
                      onChange={(e) => handleNumberInput(index, e.target.value)}
                      className="absolute top-1 left-1 w-12 px-1 py-0.5 text-xs font-medium text-center bg-white border border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="absolute top-1 left-1 bg-black text-white px-1.5 py-0.5 rounded text-xs font-medium">
                      {index + 1}
                    </div>
                  )}
                  
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    title="파일 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  {/* 수동 정렬 표시 */}
                  {sortMode === 'manual' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-blue-500 bg-opacity-90 text-white px-2 py-1 rounded-full text-xs font-medium">
                        드래그
                      </div>
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
                {sortMode === 'manual' && '드래그 정렬'}
                {sortMode === 'number' && '번호 입력 정렬'}
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