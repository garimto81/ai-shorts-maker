// 샘플 스크립트 관리 인터페이스

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SampleScript, ScriptCategory } from '@/lib/script-database';
import { scriptAutoGenerator } from '@/lib/script-auto-generator';
import VideoScriptGeneratorUI from './video-script-generator-ui';
import TTSGeneratorUI from './tts-generator-ui';

const categoryOptions = [
  { value: 'all', label: '전체' },
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'review', label: '리뷰' },
  { value: 'story', label: '스토리' },
  { value: 'news', label: '뉴스' },
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'educational', label: '교육' },
  { value: 'promotional', label: '홍보' },
  { value: 'documentary', label: '다큐멘터리' },
  { value: 'interview', label: '인터뷰' },
  { value: 'comparison', label: '비교분석' }
] as const;

export default function ScriptManagementUI() {
  const [scripts, setScripts] = useState<SampleScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategory | 'all'>('all');

  // 스크립트 목록 로드
  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scripts');
      if (response.ok) {
        const data = await response.json();
        setScripts(data);
      }
    } catch (error) {
      console.error('스크립트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 스크립트
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = !searchQuery || 
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
    
    return matchesSearch && matchesCategory && script.metadata.isActive;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 샘플 스크립트 관리
          </h1>
          <p className="text-gray-600">
            샘플 스크립트를 등록하고 관리하여 AI가 학습할 수 있도록 합니다.
          </p>
        </div>

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="manage">스크립트 관리</TabsTrigger>
            <TabsTrigger value="create">새 스크립트 등록</TabsTrigger>
            <TabsTrigger value="generate">AI 스크립트 생성</TabsTrigger>
            <TabsTrigger value="video">영상화 스크립트</TabsTrigger>
            <TabsTrigger value="tts">음성 생성</TabsTrigger>
          </TabsList>

          {/* 스크립트 관리 탭 */}
          <TabsContent value="manage" className="space-y-6">
            {/* 검색 및 필터 */}
            <Card>
              <CardHeader>
                <CardTitle>스크립트 검색 및 필터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="스크립트 제목이나 내용으로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadScripts} disabled={loading}>
                    {loading ? '로딩...' : '새로고침'}
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  총 {filteredScripts.length}개의 스크립트
                </div>
              </CardContent>
            </Card>

            {/* 스크립트 목록 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredScripts.map(script => (
                <ScriptCard key={script.id} script={script} onUpdate={loadScripts} />
              ))}
            </div>

            {filteredScripts.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">조건에 맞는 스크립트가 없습니다.</p>
                  <Button>
                    첫 번째 스크립트 만들기
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 스크립트 생성 탭 */}
          <TabsContent value="create">
            <CreateScriptForm onSuccess={loadScripts} />
          </TabsContent>

          {/* AI 생성 탭 */}
          <TabsContent value="generate">
            <AIScriptGenerator scripts={scripts} />
          </TabsContent>

          {/* 영상화 스크립트 탭 */}
          <TabsContent value="video">
            <VideoScriptTab scripts={scripts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 개별 스크립트 카드 컴포넌트
function ScriptCard({ script, onUpdate }: { script: SampleScript; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 이 스크립트를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/scripts/${script.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{script.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {script.description}
            </CardDescription>
          </div>
          <Badge variant={script.category === 'tutorial' ? 'default' : 'secondary'}>
            {categoryOptions.find(opt => opt.value === script.category)?.label || script.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 메타데이터 */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>⏱️ {script.content.timing.totalDuration}초</span>
          <span>📈 {script.metadata.usageCount}회 사용</span>
          <span>⭐ {script.metadata.rating.toFixed(1)}</span>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1">
          {script.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {script.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{script.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* 내용 미리보기 */}
        {expanded && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">나레이션 전체:</h4>
            <div className="text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto p-3 bg-white border rounded-lg">
              {script.content.narration}
            </div>
            
            <h4 className="font-medium text-sm mt-3">장면 구성:</h4>
            <div className="space-y-1">
              {script.content.scenes.map((scene, idx) => (
                <div key={idx} className="text-xs text-gray-600">
                  {idx + 1}. {scene.description} ({scene.duration}초)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="flex-1"
          >
            {expanded ? '접기' : '자세히'}
          </Button>
          <Button variant="outline" size="sm">
            편집
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 새 스크립트 생성 폼
function CreateScriptForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ScriptCategory,
    tags: '',
    narration: '',
    scenes: '',
    totalDuration: 30,
    stylePrompt: '',
    structurePrompt: '',
    tonePrompt: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 본문이 없으면 등록 불가
      if (!formData.narration.trim()) {
        alert('스크립트 본문을 입력해주세요.');
        setSubmitting(false);
        return;
      }

      let finalFormData = { ...formData };

      // 빈 필드가 있으면 AI로 자동 생성
      const hasEmptyFields = !formData.title.trim() || 
                            !formData.description.trim() || 
                            !formData.category || 
                            !formData.tags.trim();

      if (hasEmptyFields) {
        try {
          console.log('빈 필드 감지, AI 자동 생성 실행...');
          const autoGenResponse = await fetch('/api/scripts/auto-generate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json; charset=utf-8',
              'Accept': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ content: formData.narration })
          });

          console.log('AI 응답 상태:', autoGenResponse.status, autoGenResponse.statusText);

          if (autoGenResponse.ok) {
            const autoGenResult = await autoGenResponse.json();
            console.log('AI 응답 데이터:', autoGenResult);
            
            if (autoGenResult.success && autoGenResult.data) {
              // 빈 필드만 AI 결과로 채우기
              finalFormData = {
                ...formData,
                title: formData.title.trim() || autoGenResult.data.title || '자동 생성된 제목',
                description: formData.description.trim() || autoGenResult.data.description || '스크립트 설명입니다.',
                category: formData.category || autoGenResult.data.category || 'tutorial',
                tags: formData.tags.trim() || (autoGenResult.data.tags ? autoGenResult.data.tags.join(', ') : '기본태그'),
                totalDuration: formData.totalDuration || (autoGenResult.data.metadata ? autoGenResult.data.metadata.estimatedDuration : 30),
                tonePrompt: formData.tonePrompt || (autoGenResult.data.aiAnalysis ? autoGenResult.data.aiAnalysis.tone : ''),
                stylePrompt: formData.stylePrompt || (autoGenResult.data.aiAnalysis ? `${autoGenResult.data.aiAnalysis.businessType || ''} 업종, ${autoGenResult.data.aiAnalysis.targetAudience || ''} 대상` : ''),
                structurePrompt: formData.structurePrompt || (autoGenResult.data.aiAnalysis ? `${autoGenResult.data.aiAnalysis.detectedTopic || ''} 중심의 구조` : ''),
                scenes: formData.scenes || (autoGenResult.data.refinedContent && autoGenResult.data.refinedContent.scenes ? 
                  autoGenResult.data.refinedContent.scenes.map((scene: any) => scene.description).join('\n') : '')
              };
              console.log('AI 자동 생성 완료, 등록 진행...');
            } else {
              throw new Error(autoGenResult.error || 'AI 응답이 유효하지 않습니다.');
            }
          } else {
            const errorText = await autoGenResponse.text();
            throw new Error(`HTTP ${autoGenResponse.status}: ${errorText}`);
          }
        } catch (autoGenError: any) {
          console.error('AI 자동 생성 실패, 기본값으로 진행:', autoGenError);
          alert(`AI 자동 생성 실패: ${autoGenError.message}. 기본값으로 등록을 진행합니다.`);
          
          // AI 생성 실패해도 기본값으로 등록 진행
          finalFormData = {
            ...formData,
            title: formData.title.trim() || '자동 생성된 제목',
            description: formData.description.trim() || '스크립트 내용을 기반으로 생성된 설명입니다.',
            category: formData.category || 'tutorial',
            tags: formData.tags.trim() || '기본태그'
          };
        }
      }

      // 장면 파싱
      const scenes = finalFormData.scenes.split('\n')
        .map((line, idx) => line.trim())
        .filter(line => line.length > 0)
        .map((description, idx) => ({
          sequence: idx + 1,
          description,
          duration: Math.floor(finalFormData.totalDuration / Math.max(1, finalFormData.scenes.split('\n').filter(l => l.trim()).length)),
          visualCues: [],
        }));

      const scriptData = {
        title: finalFormData.title,
        description: finalFormData.description,
        category: finalFormData.category,
        tags: finalFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        content: {
          narration: finalFormData.narration,
          scenes,
          timing: {
            totalDuration: finalFormData.totalDuration,
            introLength: Math.floor(finalFormData.totalDuration * 0.2),
            mainLength: Math.floor(finalFormData.totalDuration * 0.6),
            outroLength: Math.floor(finalFormData.totalDuration * 0.2),
          }
        },
        aiPrompts: {
          stylePrompt: finalFormData.stylePrompt,
          structurePrompt: finalFormData.structurePrompt,
          tonePrompt: finalFormData.tonePrompt,
        }
      };

      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptData)
      });

      if (response.ok) {
        // 폼 리셋
        setFormData({
          title: '',
          description: '',
          category: '' as ScriptCategory,
          tags: '',
          narration: '',
          scenes: '',
          totalDuration: 30,
          stylePrompt: '',
          structurePrompt: '',
          tonePrompt: ''
        });
        onSuccess();
        alert('스크립트가 성공적으로 등록되었습니다!' + (hasEmptyFields ? ' (AI가 빈 필드를 자동으로 채웠습니다)' : ''));
      } else {
        alert('등록 실패');
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // AI 자동 생성 처리
  const handleAutoGenerate = async () => {
    if (!formData.narration.trim()) {
      alert('본문을 먼저 입력해주세요.');
      return;
    }

    setAutoGenerating(true);

    try {
      const response = await fetch('/api/scripts/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData.narration })
      });

      if (!response.ok) {
        throw new Error('자동 생성 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        // AI가 생성한 메타데이터로 폼 업데이트
        setFormData({
          ...formData,
          title: result.data.title,
          description: result.data.description,
          category: result.data.category as ScriptCategory,
          tags: result.data.tags.join(', '),
          totalDuration: result.data.metadata.estimatedDuration,
          tonePrompt: result.data.aiAnalysis.tone,
          stylePrompt: `${result.data.aiAnalysis.businessType} 업종, ${result.data.aiAnalysis.targetAudience} 대상`,
          structurePrompt: `${result.data.aiAnalysis.detectedTopic} 중심의 구조`,
          scenes: result.data.refinedContent.scenes.map((scene: any) => scene.description).join('\n')
        });
        
        alert(`AI가 메타데이터를 성공적으로 생성했습니다! (신뢰도: ${Math.round(result.data.aiAnalysis.confidence * 100)}%)`);
      } else {
        throw new Error(result.error || '자동 생성 실패');
      }
    } catch (error: any) {
      console.error('자동 생성 오류:', error);
      alert(`자동 생성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setAutoGenerating(false);
    }
  };

  const createCategoryOptions = [
    { value: 'tutorial', label: '튜토리얼' },
    { value: 'review', label: '리뷰' },
    { value: 'story', label: '스토리' },
    { value: 'news', label: '뉴스' },
    { value: 'entertainment', label: '엔터테인먼트' },
    { value: 'educational', label: '교육' },
    { value: 'promotional', label: '홍보' },
    { value: 'documentary', label: '다큐멘터리' },
    { value: 'interview', label: '인터뷰' },
    { value: 'comparison', label: '비교분석' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 샘플 스크립트 등록</CardTitle>
        <CardDescription>
          본문만 입력하면 AI가 제목, 설명, 카테고리, 태그를 자동으로 생성해드립니다.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="예: 스마트폰 사진 잘 찍는 방법 (비워두면 AI가 자동 생성)"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <Select 
                value={formData.category} 
                onValueChange={(value: ScriptCategory) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택 (비워두면 AI가 자동 선택)" />
                </SelectTrigger>
                <SelectContent>
                  {createCategoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="이 스크립트의 목적과 특징을 설명하세요 (비워두면 AI가 자동 생성)"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">태그</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="사진, 팁, 초보자 (쉼표로 구분, 비워두면 AI가 자동 생성)"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">총 길이 (초)</label>
              <Input
                type="number"
                value={formData.totalDuration}
                onChange={(e) => setFormData({...formData, totalDuration: parseInt(e.target.value) || 30})}
                min={10}
                max={120}
              />
            </div>
          </div>

          {/* 스크립트 내용 - 간소화된 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">스크립트 본문 *</label>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">
                💡 <strong>간편 입력:</strong> 본문만 입력하시면 AI가 나머지 정보를 자동으로 추론합니다.
              </div>
              {formData.narration.trim().length > 10 && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={handleAutoGenerate}
                  disabled={autoGenerating}
                  className="gap-2"
                >
                  {autoGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      생성 중...
                    </>
                  ) : (
                    <>
                      🤖 AI 자동 생성
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              value={formData.narration}
              onChange={(e) => setFormData({...formData, narration: e.target.value})}
              placeholder="예시: 오늘 입고된차는 sm6 차량입니다. 차주분이 휠복원 자체를 고민하시다 입고해주셨는데요..."
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">장면 구성</label>
            <Textarea
              value={formData.scenes}
              onChange={(e) => setFormData({...formData, scenes: e.target.value})}
              placeholder={"각 장면을 한 줄씩 입력하세요:\n스마트폰을 든 손 클로즈업\n카메라 설정 화면 보여주기\n실제 촬영 장면"}
              rows={4}
            />
          </div>

          {/* AI 학습용 프롬프트 */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">AI 학습 가이드</h3>
            <p className="text-sm text-blue-700">
              다음 정보는 AI가 이 스크립트의 스타일을 학습하는 데 사용됩니다.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-900">톤 특성</label>
              <Input
                value={formData.tonePrompt}
                onChange={(e) => setFormData({...formData, tonePrompt: e.target.value})}
                placeholder="예: 친근하고 따뜻한, 전문적이면서 쉬운"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-900">구조 패턴</label>
              <Input
                value={formData.structurePrompt}
                onChange={(e) => setFormData({...formData, structurePrompt: e.target.value})}
                placeholder="예: 문제 제시 → 해결 과정 → 결과 확인"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-900">스타일 특징</label>
              <Input
                value={formData.stylePrompt}
                onChange={(e) => setFormData({...formData, stylePrompt: e.target.value})}
                placeholder="예: 구체적인 예시 포함, 단계별 설명, 시각적 요소 활용"
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? '등록 중...' : '스크립트 등록'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// AI 스크립트 생성기 컴포넌트
function AIScriptGenerator({ scripts }: { scripts: SampleScript[] }) {
  const [generationData, setGenerationData] = useState({
    topic: '',
    category: '' as ScriptCategory,
    targetDuration: 30,
    style: 'casual' as 'formal' | 'casual' | 'energetic' | 'calm' | 'educational',
    audience: 'general' as 'general' | 'teens' | 'adults' | 'professionals' | 'seniors',
    sampleScriptIds: [] as string[],
    customTone: '',
    customStyle: '',
    customContent: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: generationData.topic,
          category: generationData.category,
          targetDuration: generationData.targetDuration,
          style: generationData.style,
          audience: generationData.audience,
          sampleScriptIds: generationData.sampleScriptIds,
          customPrompts: {
            tone: generationData.customTone,
            style: generationData.customStyle,
            content: generationData.customContent,
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedScript(result);
      } else {
        alert('생성 실패');
      }
    } catch (error) {
      console.error('생성 오류:', error);
      alert('생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const generateCategoryOptions = [
    { value: 'tutorial', label: '튜토리얼' },
    { value: 'review', label: '리뷰' },
    { value: 'story', label: '스토리' },
    { value: 'news', label: '뉴스' },
    { value: 'entertainment', label: '엔터테인먼트' },
    { value: 'educational', label: '교육' },
    { value: 'promotional', label: '홍보' },
    { value: 'documentary', label: '다큐멘터리' },
    { value: 'interview', label: '인터뷰' },
    { value: 'comparison', label: '비교분석' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 AI 스크립트 생성</CardTitle>
          <CardDescription>
            등록된 샘플 스크립트를 기반으로 새로운 스크립트를 생성합니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">주제 *</label>
                <Input
                  value={generationData.topic}
                  onChange={(e) => setGenerationData({...generationData, topic: e.target.value})}
                  placeholder="예: 집에서 할 수 있는 운동법"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">카테고리 *</label>
                <Select 
                  value={generationData.category} 
                  onValueChange={(value: ScriptCategory) => setGenerationData({...generationData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">목표 길이 (초)</label>
                <Input
                  type="number"
                  value={generationData.targetDuration}
                  onChange={(e) => setGenerationData({...generationData, targetDuration: parseInt(e.target.value) || 30})}
                  min={10}
                  max={120}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">스타일</label>
                <Select 
                  value={generationData.style} 
                  onValueChange={(value: any) => setGenerationData({...generationData, style: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">공식적</SelectItem>
                    <SelectItem value="casual">캐주얼</SelectItem>
                    <SelectItem value="energetic">활기찬</SelectItem>
                    <SelectItem value="calm">차분한</SelectItem>
                    <SelectItem value="educational">교육적</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">대상 관객</label>
                <Select 
                  value={generationData.audience} 
                  onValueChange={(value: any) => setGenerationData({...generationData, audience: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="teens">청소년</SelectItem>
                    <SelectItem value="adults">성인</SelectItem>
                    <SelectItem value="professionals">전문가</SelectItem>
                    <SelectItem value="seniors">시니어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 참조 스크립트 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">참조할 샘플 스크립트</label>
              <div className="grid gap-2 md:grid-cols-2">
                {scripts.slice(0, 6).map(script => (
                  <div key={script.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={script.id}
                      checked={generationData.sampleScriptIds.includes(script.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGenerationData({
                            ...generationData,
                            sampleScriptIds: [...generationData.sampleScriptIds, script.id]
                          });
                        } else {
                          setGenerationData({
                            ...generationData,
                            sampleScriptIds: generationData.sampleScriptIds.filter(id => id !== script.id)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={script.id} className="text-sm cursor-pointer flex-1">
                      {script.title}
                      <Badge className="ml-2 text-xs">{script.category}</Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={generating} className="w-full">
              {generating ? '생성 중...' : '🎬 스크립트 생성'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 생성 결과 */}
      {generatedScript && (
        <Card>
          <CardHeader>
            <CardTitle>생성된 스크립트</CardTitle>
            <CardDescription>
              AI가 생성한 스크립트입니다. 필요에 따라 수정하여 사용하세요.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">제목</h3>
              <p className="text-lg">{generatedScript.title}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">나레이션</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="leading-relaxed">{generatedScript.content.narration}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">장면 구성</h3>
              <div className="space-y-2">
                {generatedScript.content.scenes.map((scene: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{idx + 1}</Badge>
                      <span className="text-sm text-gray-500">{scene.duration}초</span>
                    </div>
                    <p className="text-sm mb-1">{scene.description}</p>
                    <p className="text-xs text-gray-600">{scene.narration}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {generatedScript.suggestions && (
              <div>
                <h3 className="font-medium mb-2">개선 제안</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  {generatedScript.suggestions.improvements.map((suggestion: string, idx: number) => (
                    <li key={idx}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline">편집</Button>
              <Button>샘플로 저장</Button>
              <Button variant="outline">다시 생성</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 영상화 스크립트 탭 컴포넌트
function VideoScriptTab({ scripts }: { scripts: SampleScript[] }) {
  const [selectedScript, setSelectedScript] = useState<SampleScript | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎬 영상화 스크립트 생성</CardTitle>
          <CardDescription>
            등록된 스크립트를 선택하여 영상 제작에 최적화된 스크립트를 생성합니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!selectedScript ? (
            <div className="space-y-4">
              <h3 className="font-medium">영상화할 스크립트 선택</h3>
              
              {scripts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>등록된 스크립트가 없습니다.</p>
                  <p className="text-sm mt-2">먼저 "새 스크립트 등록" 탭에서 스크립트를 등록해주세요.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {scripts.map(script => (
                    <div 
                      key={script.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedScript(script)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{script.title}</h4>
                        <Badge variant="outline">{script.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {script.description.length > 100 
                          ? script.description.substring(0, 100) + '...'
                          : script.description
                        }
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>⏱️ {script.content.timing.totalDuration}초</span>
                        <span>📝 {script.content.narration.length}자</span>
                        <span>🎬 {script.content.scenes.length}장면</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">선택된 스크립트: {selectedScript.title}</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedScript(null)}
                >
                  다른 스크립트 선택
                </Button>
              </div>
              
              <VideoScriptGeneratorUI 
                baseScript={selectedScript}
                onGenerated={(result) => {
                  console.log('영상 스크립트 생성 완료:', result);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTS 음성 생성 탭 */}
      <TabsContent value="tts">
        <TTSGeneratorUI />
      </TabsContent>
    </div>
  );
}