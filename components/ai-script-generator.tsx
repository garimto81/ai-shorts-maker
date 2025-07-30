// AI 스크립트 생성 컴포넌트

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Sparkles } from 'lucide-react';

export interface VideoScript {
  title: string;
  duration: number; // 초 단위
  sections: ScriptSection[];
  narration: string;
  musicSuggestion?: string;
  subtitles?: {
    imageSubtitles: any[];
    stats: any;
    readingSpeed: string;
    srtFormat: string;
  };
  imageAnalysis?: {
    totalImages: number;
    overallTheme: string;
    storyFlow: string;
    recommendedTone: string;
    analysisTime: number;
    images: Array<{
      filename: string;
      description: string;
      suggestedNarration: string;
      confidence: number;
      mainSubjects: string[];
      scene: string;
      mood: string;
    }>;
  };
}

export interface ScriptSection {
  imageIndex: number;
  duration: number;
  text: string;
  transition?: string;
}

interface AIScriptGeneratorProps {
  projectTitle: string;
  sortedFiles: File[];
  uploadedImagePaths?: string[]; // 서버에 업로드된 이미지 경로들 (이미지 분석용)
  onScriptGenerated: (script: VideoScript) => void;
}

export default function AIScriptGenerator({ 
  projectTitle, 
  sortedFiles, 
  uploadedImagePaths,
  onScriptGenerated 
}: AIScriptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptType, setScriptType] = useState<'short' | 'medium' | 'long'>('short');
  const [tone, setTone] = useState<'casual' | 'professional' | 'educational'>('casual');
  const [readingSpeed, setReadingSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [useImageAnalysis, setUseImageAnalysis] = useState(true); // 이미지 분석 사용 여부
  const [error, setError] = useState<string | null>(null);

  const generateScript = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // 이미지 분석 사용 여부와 업로드된 경로 확인
      const shouldUseImageAnalysis = useImageAnalysis && uploadedImagePaths && uploadedImagePaths.length > 0;
      
      console.log('스크립트 생성 요청:', {
        projectTitle,
        imageCount: sortedFiles.length,
        useImageAnalysis: shouldUseImageAnalysis,
        imagePaths: shouldUseImageAnalysis ? uploadedImagePaths : undefined,
        imageNames: sortedFiles.map(f => f.name),
        scriptType,
        tone,
        readingSpeed
      });

      let apiEndpoint: string;
      let requestBody: any;

      if (shouldUseImageAnalysis) {
        // 이미지 분석 기반 스크립트 생성
        apiEndpoint = '/api/scripts/generate-with-image-analysis';
        requestBody = {
          projectTitle,
          imagePaths: uploadedImagePaths,
          scriptType,
          tone,
          readingSpeed
        };
      } else {
        // 기존 파일명 기반 스크립트 생성
        apiEndpoint = '/api/scripts/generate-from-images';
        requestBody = {
          projectTitle,
          imageCount: sortedFiles.length,
          imageNames: sortedFiles.map(f => f.name),
          scriptType,
          tone,
          readingSpeed
        };
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API 응답 오류:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status} 오류`);
      }

      const script = await response.json();
      console.log('스크립트 생성 성공:', script);
      
      // 이미지 분석 결과가 있으면 로그로 표시
      if (script.imageAnalysis) {
        console.log('이미지 분석 결과:', {
          overallTheme: script.imageAnalysis.overallTheme,
          storyFlow: script.imageAnalysis.storyFlow,
          analysisTime: script.imageAnalysis.analysisTime + 'ms',
          averageConfidence: (script.imageAnalysis.images.reduce((sum: number, img: any) => sum + img.confidence, 0) / script.imageAnalysis.images.length).toFixed(2)
        });
      }
      
      onScriptGenerated(script);
    } catch (error) {
      console.error('Script generation failed:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDuration = () => {
    const imageCount = sortedFiles.length;
    switch (scriptType) {
      case 'short': return `${Math.min(imageCount * 2.5, 60).toFixed(0)}초`;
      case 'medium': return `${Math.min(imageCount * 3.5, 60).toFixed(0)}초`;
      case 'long': return `${Math.min(imageCount * 4.5, 60).toFixed(0)}초`;
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* 이미지 분석 기능 토글 */}
      {uploadedImagePaths && uploadedImagePaths.length > 0 && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-green-900">🔍 이미지 분석 기능</div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useImageAnalysis}
                onChange={(e) => setUseImageAnalysis(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-green-800">사용</span>
            </label>
          </div>
          <div className="text-xs text-green-700">
            {useImageAnalysis 
              ? '✅ 이미지 내용을 분석하여 정확한 스크립트를 생성합니다 (시간 소요: 약 30초-1분)'
              : '⚠️ 파일명만으로 스크립트를 생성합니다 (빠르지만 부정확할 수 있음)'
            }
          </div>
        </div>
      )}

      {/* 스크립트 설정 정보 */}
      <div className="bg-blue-50 p-3 rounded text-sm">
        <div className="font-medium text-blue-900 mb-2">스크립트 설정</div>
        <div className="grid grid-cols-2 gap-2 text-blue-800">
          <div>이미지 수: {sortedFiles.length}개</div>
          <div>예상 길이: {getDuration()}</div>
          <div>스타일: {scriptType === 'short' ? '짧고 간결' : scriptType === 'medium' ? '적당한 길이' : '상세한 설명'}</div>
          <div>톤: {tone === 'casual' ? '친근함' : tone === 'professional' ? '전문적' : '교육적'}</div>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          * 쇼츠 형식으로 최대 60초까지 생성됩니다
          {useImageAnalysis && uploadedImagePaths && (
            <>
              <br />* 이미지 분석으로 더 정확한 스크립트가 생성됩니다
            </>
          )}
        </div>
      </div>

      <Button 
        onClick={generateScript} 
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {useImageAnalysis && uploadedImagePaths ? '이미지 분석 및 스크립트 생성중...' : '스크립트 생성중...'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {useImageAnalysis && uploadedImagePaths ? '🔍 이미지 분석하여 스크립트 생성' : '📝 스크립트 생성'}
          </>
        )}
      </Button>
    </div>
  );
}