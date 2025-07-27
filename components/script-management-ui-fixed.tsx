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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">스크립트 관리</TabsTrigger>
            <TabsTrigger value="create">새 스크립트 등록</TabsTrigger>
            <TabsTrigger value="generate">AI 스크립트 생성</TabsTrigger>
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
            <h4 className="font-medium text-sm">나레이션 미리보기:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {script.content.narration.length > 200 
                ? script.content.narration.substring(0, 200) + '...'
                : script.content.narration
              }
            </p>
            
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
  const [submitting, setSubmitting] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 샘플 스크립트 등록</CardTitle>
        <CardDescription>
          AI가 학습할 수 있는 고품질 샘플 스크립트를 등록하세요.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Input placeholder="스크립트 제목" />
          <Textarea placeholder="스크립트 설명" rows={2} />
          <Input placeholder="나레이션 텍스트" />
          <div className="text-center py-8 text-gray-500">
            스크립트 등록 폼이 여기에 표시됩니다.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// AI 스크립트 생성기 컴포넌트
function AIScriptGenerator({ scripts }: { scripts: SampleScript[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 AI 스크립트 생성</CardTitle>
        <CardDescription>
          등록된 샘플 스크립트를 기반으로 새로운 스크립트를 생성합니다.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Input placeholder="생성할 스크립트 주제" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.slice(1).map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-center py-8 text-gray-500">
            AI 스크립트 생성기가 여기에 표시됩니다.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}