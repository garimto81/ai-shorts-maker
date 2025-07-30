// 파일 업로드 기능이 포함된 비디오 렌더러 래퍼 컴포넌트 (v1.6.1)

'use client';

import React, { useState, useEffect } from 'react';
import VideoRendererUI from './video-renderer-ui';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle } from 'lucide-react';

interface SortedFileData {
  filename: string;
  originalIndex: number;
  finalIndex: number;
  confidence: number;
  sortingReasons: string[];
}

interface VideoRendererWithUploadProps {
  sortedFiles: SortedFileData[];
  originalFiles: File[];
  projectTitle: string;
  script?: any; // VideoScript 타입 (필수)
  onRenderComplete?: (result: any) => void;
}

export default function VideoRendererWithUpload({
  sortedFiles,
  originalFiles,
  projectTitle,
  script,
  onRenderComplete
}: VideoRendererWithUploadProps) {
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * 정렬된 순서대로 파일들을 서버에 업로드
   */
  const uploadSortedFiles = async () => {
    if (sortedFiles.length === 0 || originalFiles.length === 0) {
      setUploadError('업로드할 파일이 없습니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // FormData 구성 - 정렬된 순서대로
      const formData = new FormData();
      
      for (let i = 0; i < sortedFiles.length; i++) {
        const sortedFile = sortedFiles[i];
        const originalFile = originalFiles.find(f => f.name === sortedFile.filename);
        
        if (originalFile) {
          // 정렬된 순서에 맞게 파일명을 조정
          const renamedFile = new File([originalFile], `sorted_${i + 1}_${originalFile.name}`, {
            type: originalFile.type,
            lastModified: originalFile.lastModified
          });
          formData.append('images', renamedFile);
        } else {
          console.warn(`원본 파일을 찾을 수 없음: ${sortedFile.filename}`);
        }
        
        // 진행률 업데이트
        setUploadProgress((i + 1) / sortedFiles.length * 50); // 50%까지는 파일 준비
      }

      console.log('📁 정렬된 파일 업로드 시작:', {
        totalFiles: sortedFiles.length,
        projectTitle
      });

      // 서버에 업로드
      const response = await fetch('/api/upload-temp-images', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(75);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedImagePaths(result.data.imagePaths);
        setUploadProgress(100);
        setIsReady(true);
        
        console.log('✅ 파일 업로드 완료:', {
          count: result.data.count,
          paths: result.data.imagePaths
        });
      } else {
        throw new Error(result.error || '파일 업로드 실패');
      }

    } catch (error: any) {
      console.error('❌ 파일 업로드 오류:', error);
      setUploadError(`파일 업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 업로드 시작
  useEffect(() => {
    if (sortedFiles.length > 0 && originalFiles.length > 0 && !isReady && !isUploading) {
      uploadSortedFiles();
    }
  }, [sortedFiles, originalFiles]);

  // 업로드 중이거나 준비되지 않은 경우
  if (!isReady) {
    return (
      <div className="space-y-6">
        {uploadError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-center p-8">
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="text-lg font-semibold">
              {isUploading ? '파일을 서버에 업로드 중...' : '파일 업로드 준비 중...'}
            </h3>
            
            {isUploading && (
              <>
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-600">
                  정렬된 이미지 파일들을 서버에 업로드하고 있습니다. ({Math.round(uploadProgress)}%)
                </p>
              </>
            )}
            
            {uploadError && (
              <Button onClick={uploadSortedFiles} className="mt-4">
                다시 시도
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 업로드 완료 후 실제 VideoRendererUI 렌더링
  return (
    <VideoRendererUI
      images={uploadedImagePaths}
      projectTitle={projectTitle}
      videoScript={{
        title: script?.title || projectTitle,
        totalDuration: script?.duration || Math.min(Math.max(10, sortedFiles.length * 3), 60), // 60초 제한
        scenes: sortedFiles.map((file, index) => ({
          id: `scene_${index + 1}`,
          title: script?.sections?.[index]?.text || `장면 ${index + 1}`,
          startTime: script?.sections?.[index]?.duration ? 
            script.sections.slice(0, index).reduce((sum: number, s: any) => sum + s.duration, 0) : 
            index * Math.min(3, 60 / sortedFiles.length), // 동적 시간 배분
          endTime: script?.sections?.[index]?.duration ? 
            script.sections.slice(0, index + 1).reduce((sum: number, s: any) => sum + s.duration, 0) : 
            (index + 1) * Math.min(3, 60 / sortedFiles.length),
          duration: script?.sections?.[index]?.duration || Math.min(3, 60 / sortedFiles.length)
        })),
        narration: {
          segments: script?.sections?.map((section: any, index: number) => ({
            id: `narration_${index + 1}`,
            text: section.text,
            startTime: script.sections.slice(0, index).reduce((sum: number, s: any) => sum + s.duration, 0),
            endTime: script.sections.slice(0, index + 1).reduce((sum: number, s: any) => sum + s.duration, 0),
            duration: section.duration
          })) || sortedFiles.map((file, index) => ({
            id: `narration_${index + 1}`,
            text: `장면 ${index + 1}`,
            startTime: index * Math.min(3, 60 / sortedFiles.length),
            endTime: (index + 1) * Math.min(3, 60 / sortedFiles.length),
            duration: Math.min(3, 60 / sortedFiles.length)
          }))
        }
      }}
      // 쇼츠용 9:16 비율 설정
      defaultSettings={{
        resolution: '1080x1920',
        aspectRatio: '9:16',
        format: 'mp4',
        quality: 'high'
      }}
      onRenderComplete={onRenderComplete}
    />
  );
}