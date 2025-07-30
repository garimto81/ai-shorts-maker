// 생성된 스크립트 미리보기 컴포넌트

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoScript, ScriptSection } from './ai-script-generator';
import { Volume2, Loader2, Play, Pause, Download } from 'lucide-react';

interface ScriptPreviewProps {
  script: VideoScript;
  onCreateVideo: () => void;
  onEditScript?: (script: VideoScript) => void;
}

export default function ScriptPreview({ 
  script, 
  onCreateVideo,
  onEditScript 
}: ScriptPreviewProps) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // 음성 생성
  const generateAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioError(null);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script.narration,
          voice: 'default',
          speed: 'normal',
          style: 'neutral',
          language: 'ko',
          format: 'mp3'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status} 오류`);
      }

      const result = await response.json();
      if (result.success && result.data.audioUrl) {
        setAudioUrl(result.data.audioUrl);
      } else {
        throw new Error('음성 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
      setAudioError(error instanceof Error ? error.message : '음성 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // 음성 재생/정지
  const toggleAudio = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded">
        <div className="text-sm space-y-3">
          <p><strong>{script.title}</strong></p>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">전체 나레이션:</p>
            <p className="text-gray-600">{script.narration}</p>
          </div>
          
          {/* 각 이미지별 스크립트 섹션 표시 */}
          {script.sections && script.sections.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-gray-700">이미지별 내용:</p>
              <div className="space-y-3">
                {script.sections.map((section: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border-l-2 border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        이미지 {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{section.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          총 {section.duration}초 동안 표시
                        </p>
                      </div>
                    </div>
                    
                    {/* 자막 세그먼트 표시 */}
                    {script.subtitles?.imageSubtitles?.[index]?.segments && (
                      <div className="ml-6 space-y-1">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          자막 ({script.subtitles.imageSubtitles[index].segments.length}개):
                        </p>
                        {script.subtitles.imageSubtitles[index].segments.map((subtitle: any, subIndex: number) => (
                          <div key={subIndex} className="flex items-center gap-2 text-xs">
                            <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs min-w-[24px] text-center">
                              {subIndex + 1}
                            </span>
                            <span className="text-gray-600 font-mono">
                              {subtitle.startTime.toFixed(1)}s - {subtitle.endTime.toFixed(1)}s
                            </span>
                            <span className="text-gray-800 flex-1">
                              "{subtitle.text}"
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 자막 통계 */}
              {script.subtitles?.stats && (
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p className="font-medium text-blue-800 mb-1">자막 통계:</p>
                  <div className="grid grid-cols-2 gap-2 text-blue-700">
                    <span>총 자막: {script.subtitles.stats.totalSubtitles}개</span>
                    <span>이미지당 평균: {script.subtitles.stats.averageSubtitlesPerImage.toFixed(1)}개</span>
                    <span>읽기 속도: {script.subtitles.readingSpeed}</span>
                    <span>총 시간: {script.subtitles.stats.totalDuration.toFixed(1)}초</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 이미지 분석 결과 표시 */}
          {script.imageAnalysis && (
            <div className="space-y-3 mt-4">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="font-medium text-green-800 mb-2">🔍 이미지 분석 결과</p>
                <div className="text-sm space-y-2">
                  <div><strong className="text-green-700">전체 테마:</strong> <span className="text-green-600">{script.imageAnalysis.overallTheme}</span></div>
                  <div><strong className="text-green-700">스토리 흐름:</strong> <span className="text-green-600">{script.imageAnalysis.storyFlow}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>분석 시간: {(script.imageAnalysis.analysisTime / 1000).toFixed(1)}초</span>
                    <span>추천 톤: {script.imageAnalysis.recommendedTone === 'casual' ? '친근함' : script.imageAnalysis.recommendedTone === 'professional' ? '전문적' : '교육적'}</span>
                    <span>평균 신뢰도: {(script.imageAnalysis.images.reduce((sum, img) => sum + img.confidence, 0) / script.imageAnalysis.images.length * 100).toFixed(0)}%</span>
                    <span>분석된 이미지: {script.imageAnalysis.totalImages}개</span>
                  </div>
                </div>
              </div>

              {/* 각 이미지별 분석 결과 요약 */}
              <details className="bg-blue-50 p-3 rounded border border-blue-200">
                <summary className="font-medium text-blue-800 cursor-pointer mb-2">📸 이미지별 분석 상세</summary>
                <div className="space-y-2 text-sm">
                  {script.imageAnalysis.images.map((img, index) => (
                    <div key={index} className="border-l-2 border-blue-300 pl-3">
                      <div className="font-medium text-blue-700">{img.filename}</div>
                      <div className="text-blue-600 text-xs mt-1">{img.description}</div>
                      <div className="text-blue-500 text-xs mt-1">
                        장면: {img.scene} | 분위기: {img.mood} | 신뢰도: {(img.confidence * 100).toFixed(0)}%
                      </div>
                      {img.mainSubjects.length > 0 && (
                        <div className="text-blue-500 text-xs">주요 객체: {img.mainSubjects.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* 음성 생성 섹션 */}
      <div className="space-y-2">
        {!audioUrl && (
          <Button 
            onClick={generateAudio}
            disabled={isGeneratingAudio}
            variant="outline"
            className="w-full"
          >
            {isGeneratingAudio ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                음성 생성중...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                음성 생성
              </>
            )}
          </Button>
        )}

        {audioUrl && (
          <div className="flex gap-2">
            <Button 
              onClick={toggleAudio}
              variant="outline"
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </>
              )}
            </Button>
            <Button 
              onClick={() => {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `${script.title}_narration.mp3`;
                a.click();
              }}
              variant="outline"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        {audioError && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
            {audioError}
          </div>
        )}
      </div>
      
      <Button 
        onClick={onCreateVideo}
        className="w-full"
      >
        비디오 생성
      </Button>
    </div>
  );
}