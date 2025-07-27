import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Play, Clock, Target } from 'lucide-react';

interface Template {
  templateId: string;
  name: string;
  category: string;
  targetDuration: number;
  structure: Record<string, TemplateSection>;
  style: TemplateStyle;
  rules: string[];
}

interface TemplateSection {
  duration: number;
  purpose: string;
  prompt: string;
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'social-media', name: '소셜미디어' },
    { id: 'review', name: '리뷰/후기' },
    { id: 'education', name: '교육/튜토리얼' },
    { id: 'storytelling', name: '스토리텔링' },
    { id: 'business', name: '비즈니스' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('템플릿 로딩 에러:', error);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">스크립트 템플릿 관리</h1>
        <Button onClick={() => setIsEditing(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          새 템플릿 추가
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 템플릿 목록 */}
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.templateId}
                template={template}
                onSelect={() => setSelectedTemplate(template)}
                onEdit={() => {
                  setSelectedTemplate(template);
                  setIsEditing(true);
                }}
                onDelete={() => handleDeleteTemplate(template.templateId)}
                isSelected={selectedTemplate?.templateId === template.templateId}
              />
            ))}
          </div>
        </div>

        {/* 템플릿 상세/편집 */}
        <div className="lg:col-span-1">
          {isEditing ? (
            <TemplateEditor
              template={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsEditing(false);
                setSelectedTemplate(null);
              }}
            />
          ) : selectedTemplate ? (
            <TemplateDetail template={selectedTemplate} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                템플릿을 선택하여 상세 정보를 확인하세요
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  async function handleSaveTemplate(template: Template) {
    try {
      const method = template.templateId ? 'PUT' : 'POST';
      const url = template.templateId 
        ? `/api/templates/${template.templateId}` 
        : '/api/templates';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      await fetchTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('템플릿 저장 에러:', error);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      await fetchTemplates();
      if (selectedTemplate?.templateId === templateId) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('템플릿 삭제 에러:', error);
    }
  }
}

function TemplateCard({ 
  template, 
  onSelect, 
  onEdit, 
  onDelete, 
  isSelected 
}: {
  template: Template;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{template.category}</Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                {template.targetDuration}초
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>스타일:</strong> {template.style.tone}
          </div>
          <div className="text-sm text-gray-600">
            <strong>구조:</strong> {Object.keys(template.structure).join(' → ')}
          </div>
          <div className="text-sm text-gray-600">
            <strong>규칙:</strong> {template.rules.length}개
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateDetail({ template }: { template: Template }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">기본 정보</h4>
          <div className="space-y-1 text-sm">
            <div><strong>카테고리:</strong> {template.category}</div>
            <div><strong>타겟 시간:</strong> {template.targetDuration}초</div>
            <div><strong>톤:</strong> {template.style.tone}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">구조</h4>
          <div className="space-y-2">
            {Object.entries(template.structure).map(([key, section]) => (
              <div key={key} className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-sm">{key} ({section.duration}초)</div>
                <div className="text-xs text-gray-600 mt-1">{section.purpose}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">규칙</h4>
          <ul className="space-y-1 text-sm">
            {template.rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full gap-2">
          <Play className="w-4 h-4" />
          이 템플릿으로 스크립트 생성
        </Button>
      </CardContent>
    </Card>
  );
}

function TemplateEditor({ 
  template, 
  onSave, 
  onCancel 
}: {
  template: Template | null;
  onSave: (template: Template) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Template>(
    template || {
      templateId: '',
      name: '',
      category: 'social-media',
      targetDuration: 30,
      structure: {},
      style: {
        tone: '',
        vocabulary: '',
        sentence_pattern: '',
        emotion: ''
      },
      rules: []
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {template ? '템플릿 편집' : '새 템플릿 추가'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">템플릿 이름</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: YouTube 쇼츠 - 바이럴형"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="social-media">소셜미디어</SelectItem>
              <SelectItem value="review">리뷰/후기</SelectItem>
              <SelectItem value="education">교육/튜토리얼</SelectItem>
              <SelectItem value="storytelling">스토리텔링</SelectItem>
              <SelectItem value="business">비즈니스</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">타겟 시간 (초)</label>
          <Input
            type="number"
            value={formData.targetDuration}
            onChange={(e) => setFormData({ 
              ...formData, 
              targetDuration: parseInt(e.target.value) 
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">톤</label>
          <Input
            value={formData.style.tone}
            onChange={(e) => setFormData({
              ...formData,
              style: { ...formData.style, tone: e.target.value }
            })}
            placeholder="예: 친근하고 에너지 넘치는"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)} className="flex-1">
            저장
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}