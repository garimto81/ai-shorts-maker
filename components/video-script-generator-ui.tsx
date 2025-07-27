// 영상화 스크립트 생성기 UI 컴포넌트

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SampleScript } from '@/lib/script-database';
import { VideoScriptResult, ImageAnalysis } from '@/lib/video-script-generator';

interface VideoScriptGeneratorUIProps {
  baseScript: SampleScript;
  onGenerated?: (result: VideoScriptResult) => void;
}

export default function VideoScriptGeneratorUI({ baseScript, onGenerated }: VideoScriptGeneratorUIProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<VideoScriptResult | null>(null);
  const [config, setConfig] = useState({
    narrationSpeed: 'normal' as 'slow' | 'normal' | 'fast',
    videoStyle: 'educational' as 'educational' | 'entertainment' | 'promotional' | 'documentary',
    images: [] as ImageAnalysis[]
  });

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch('/api/scripts/generate-video-script', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          baseScript,
          narrationSpeed: config.narrationSpeed,
          videoStyle: config.videoStyle,
          images: config.images
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedScript(result.data);
        onGenerated?.(result.data);
      } else {
        throw new Error(result.error || '영상 스크립트 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('영상 스크립트 생성 오류:', error);
      alert(`영상 스크립트 생성 실패: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ImageAnalysis[] = Array.from(files).map(file => ({
      filename: file.name,
      description: '업로드된 이미지',
      suggestedDuration: 5,
      visualElements: [],
      emotionalTone: 'neutral',
      usageRecommendation: 'main'
    }));

    setConfig(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* 설정 패널 */}
      <Card>
        <CardHeader>
          <CardTitle>🎬 영상화 스크립트 생성</CardTitle>
          <CardDescription>
            등록된 스크립트를 바탕으로 영상 제작에 최적화된 스크립트를 생성합니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 기본 스크립트 정보 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">기본 스크립트</h3>
            <p className="text-blue-800"><strong>제목:</strong> {baseScript.title}</p>
            <p className="text-blue-800"><strong>카테고리:</strong> {baseScript.category}</p>
            <p className="text-blue-700 mt-2">
              <strong>나레이션:</strong> {baseScript.content.narration.substring(0, 100)}...
            </p>
          </div>

          {/* 자동 길이 계산 안내 */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">🤖 자동 영상 길이 계산</h3>
            <p className="text-green-800 text-sm mb-2">
              스크립트 내용과 이미지 수량을 분석하여 최적의 영상 길이를 자동으로 결정합니다.
            </p>
            <div className="text-xs text-green-700 space-y-1">
              <p>• 나레이션 길이: {baseScript.content.narration.length}자</p>
              <p>• 업로드된 이미지: {config.images.length}개</p>
              <p>• 기존 장면 수: {baseScript.content.scenes?.length || 0}개</p>
              <p>• 예상 길이 범위: 15초 ~ 60초 (최적화하여 결정)</p>
            </div>
          </div>

          {/* 영상 설정 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">나레이션 속도</label>
              <Select 
                value={config.narrationSpeed} 
                onValueChange={(value: any) => setConfig(prev => ({ ...prev, narrationSpeed: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">느리게 (120 WPM)</SelectItem>
                  <SelectItem value="normal">보통 (160 WPM)</SelectItem>
                  <SelectItem value="fast">빠르게 (200 WPM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">영상 스타일</label>
              <Select 
                value={config.videoStyle} 
                onValueChange={(value: any) => setConfig(prev => ({ ...prev, videoStyle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educational">교육용 (차분하고 체계적)</SelectItem>
                  <SelectItem value="entertainment">엔터테인먼트 (재미있고 활기찬)</SelectItem>
                  <SelectItem value="promotional">홍보용 (매력적이고 설득력 있는)</SelectItem>
                  <SelectItem value="documentary">다큐멘터리 (진지하고 사실적)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">영상에 사용할 이미지</label>
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  이미지 추가
                </Button>
              </div>
            </div>
            
            {config.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">업로드된 이미지 ({config.images.length}개)</p>
                <div className="flex flex-wrap gap-2">
                  {config.images.map((image, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                      <span className="text-sm">{image.filename}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                영상 스크립트 생성 중...
              </>
            ) : (
              '🎬 영상 스크립트 생성'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 생성 결과 */}
      {generatedScript && (
        <VideoScriptResult result={generatedScript} />
      )}
    </div>
  );
}

// 생성 결과 표시 컴포넌트
function VideoScriptResult({ result }: { result: VideoScriptResult }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'narration' | 'scenes' | 'production'>('overview');

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 생성된 영상 스크립트</CardTitle>
        <CardDescription>
          {result.title} (총 {result.totalDuration}초)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { id: 'overview', label: '개요' },
            { id: 'narration', label: '나레이션' },
            { id: 'scenes', label: '장면 구성' },
            { id: 'production', label: '제작 가이드' }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">영상 정보</h3>
              <div className="grid gap-2 text-sm">
                <p><strong>제목:</strong> {result.title}</p>
                <p><strong>설명:</strong> {result.description}</p>
                <p><strong>총 길이:</strong> {result.totalDuration}초</p>
                <p><strong>장면 수:</strong> {result.scenes.length}개</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">타이밍 정보</h3>
              <div className="grid gap-2 text-sm">
                <p><strong>인트로:</strong> {result.timing.introLength}초</p>
                <p><strong>메인:</strong> {result.timing.mainLength}초</p>
                <p><strong>아웃트로:</strong> {result.timing.outroLength}초</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">나레이션 정보</h3>
              <div className="grid gap-2 text-sm">
                <p><strong>예상 읽기 시간:</strong> {result.narration.estimatedSpeechDuration}초</p>
                <p><strong>분당 단어 수:</strong> {result.narration.wordsPerMinute} WPM</p>
                <p><strong>세그먼트 수:</strong> {result.narration.segments.length}개</p>
              </div>
            </div>
          </div>
        )}

        {/* 나레이션 탭 */}
        {activeTab === 'narration' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">전체 나레이션</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">{result.narration.fullText}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">나레이션 세그먼트</h3>
              <div className="space-y-3">
                {result.narration.segments.map((segment, index) => (
                  <div key={segment.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{index + 1}</Badge>
                      <span className="text-sm text-gray-500">
                        {segment.startTime}초 - {segment.endTime}초 ({segment.duration}초)
                      </span>
                      <Badge variant="outline">{segment.pace}</Badge>
                    </div>
                    <p className="text-sm">{segment.text}</p>
                    {segment.emphasis.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">강조: </span>
                        {segment.emphasis.map(word => (
                          <Badge key={word} variant="secondary" className="text-xs mr-1">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 장면 구성 탭 */}
        {activeTab === 'scenes' && (
          <div className="space-y-4">
            {result.scenes.map((scene, index) => (
              <div key={scene.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Badge>{index + 1}</Badge>
                  <h3 className="font-medium">{scene.title}</h3>
                  <span className="text-sm text-gray-500">
                    {scene.startTime}초 - {scene.endTime}초 ({scene.duration}초)
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">시각적 요소:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scene.visualElements.map((element, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {element.type}: {element.content}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">전환 효과:</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {scene.transitions.type} ({scene.transitions.duration}초)
                    </Badge>
                  </div>
                  
                  {scene.narrationSegments.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">연결된 나레이션:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scene.narrationSegments.map(segmentId => (
                          <Badge key={segmentId} variant="outline" className="text-xs">
                            {segmentId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 제작 가이드 탭 */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">이미지 요구사항</h3>
              <div className="space-y-3">
                {result.productionGuide.imageRequirements.map((req, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{req.sceneId}</Badge>
                      <span className="text-sm font-medium">{req.description}</span>
                    </div>
                    <div className="grid gap-1 text-sm text-gray-600">
                      <p><strong>스타일:</strong> {req.style}</p>
                      <p><strong>해상도:</strong> {req.resolution}</p>
                      <p><strong>표시 시간:</strong> {req.duration}초</p>
                      <p><strong>목적:</strong> {req.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">전환 효과</h3>
              <div className="flex flex-wrap gap-2">
                {result.productionGuide.transitionEffects.map(effect => (
                  <Badge key={effect} variant="outline">{effect}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">배경 음악</h3>
              <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                {result.productionGuide.backgroundMusic}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">텍스트 오버레이</h3>
              <div className="space-y-2">
                {result.productionGuide.overlayText.map((overlay, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <span className="font-medium">{overlay.text}</span>
                    <span className="text-gray-500 ml-2">
                      ({overlay.startTime}초 - {overlay.endTime}초, {overlay.position})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline">JSON 다운로드</Button>
          <Button variant="outline">텍스트 출력</Button>
          <Button>프로젝트로 저장</Button>
        </div>
      </CardContent>
    </Card>
  );
}