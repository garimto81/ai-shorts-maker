// 샘플 스크립트 데이터베이스 관리 시스템

export interface SampleScript {
  id: string;
  title: string;
  description: string;
  category: ScriptCategory;
  tags: string[];
  content: {
    narration: string;          // 나레이션 텍스트
    scenes: SceneDescription[]; // 장면 설명
    timing: TimingInfo;         // 타이밍 정보
  };
  metadata: {
    author: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    rating: number;
    isActive: boolean;
  };
  aiPrompts: {
    stylePrompt: string;        // AI가 학습할 스타일 특성
    structurePrompt: string;    // AI가 학습할 구조 패턴
    tonePrompt: string;         // AI가 학습할 톤 특성
  };
}

export interface SceneDescription {
  sequence: number;
  description: string;
  duration: number; // 초 단위
  visualCues: string[];
  transitionType?: 'fade' | 'cut' | 'slide' | 'zoom';
}

export interface TimingInfo {
  totalDuration: number; // 총 길이 (초)
  introLength: number;   // 도입부 길이
  mainLength: number;    // 본문 길이
  outroLength: number;   // 마무리 길이
}

export type ScriptCategory = 
  | 'tutorial'      // 튜토리얼/설명
  | 'review'        // 리뷰/평가
  | 'story'         // 스토리텔링
  | 'news'          // 뉴스/정보
  | 'entertainment' // 엔터테인먼트
  | 'educational'   // 교육
  | 'promotional'   // 홍보/마케팅
  | 'documentary'   // 다큐멘터리
  | 'interview'     // 인터뷰
  | 'comparison';   // 비교/분석

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  structure: TemplateStructure;
  aiGuidelines: {
    contentGuidelines: string[];
    styleGuidelines: string[];
    lengthGuidelines: string[];
  };
}

export interface TemplateStructure {
  sections: TemplateSection[];
  totalDuration: number;
  flexibility: 'strict' | 'moderate' | 'flexible';
}

export interface TemplateSection {
  name: string;
  description: string;
  minDuration: number;
  maxDuration: number;
  required: boolean;
  aiPrompt: string;
}

// 로컬 JSON 파일 기반 데이터베이스 (향후 실제 DB로 마이그레이션 가능)
export class ScriptDatabase {
  private scriptsPath = './data/sample-scripts.json';
  private templatesPath = './data/script-templates.json';
  
  // 샘플 스크립트 CRUD 연산
  async getAllScripts(): Promise<SampleScript[]> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(this.scriptsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('샘플 스크립트 파일을 찾을 수 없습니다. 빈 배열을 반환합니다.');
      return [];
    }
  }
  
  async getScriptById(id: string): Promise<SampleScript | null> {
    const scripts = await this.getAllScripts();
    return scripts.find(script => script.id === id) || null;
  }
  
  async getScriptsByCategory(category: ScriptCategory): Promise<SampleScript[]> {
    const scripts = await this.getAllScripts();
    return scripts.filter(script => script.category === category);
  }
  
  async searchScripts(query: string, tags?: string[]): Promise<SampleScript[]> {
    const scripts = await this.getAllScripts();
    return scripts.filter(script => {
      const matchesQuery = !query || 
        script.title.toLowerCase().includes(query.toLowerCase()) ||
        script.description.toLowerCase().includes(query.toLowerCase()) ||
        script.content.narration.toLowerCase().includes(query.toLowerCase());
      
      const matchesTags = !tags || tags.length === 0 ||
        tags.some(tag => script.tags.includes(tag));
      
      return matchesQuery && matchesTags && script.metadata.isActive;
    });
  }
  
  async createScript(script: Omit<SampleScript, 'id' | 'metadata'>): Promise<SampleScript> {
    const scripts = await this.getAllScripts();
    
    const newScript: SampleScript = {
      ...script,
      id: this.generateId(),
      metadata: {
        author: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0,
        isActive: true,
      }
    };
    
    scripts.push(newScript);
    await this.saveScripts(scripts);
    return newScript;
  }
  
  async updateScript(id: string, updates: Partial<SampleScript>): Promise<SampleScript | null> {
    const scripts = await this.getAllScripts();
    const index = scripts.findIndex(script => script.id === id);
    
    if (index === -1) return null;
    
    scripts[index] = {
      ...scripts[index],
      ...updates,
      metadata: {
        ...scripts[index].metadata,
        updatedAt: new Date(),
      }
    };
    
    await this.saveScripts(scripts);
    return scripts[index];
  }
  
  async deleteScript(id: string): Promise<boolean> {
    const scripts = await this.getAllScripts();
    const filteredScripts = scripts.filter(script => script.id !== id);
    
    if (filteredScripts.length === scripts.length) return false;
    
    await this.saveScripts(filteredScripts);
    return true;
  }
  
  async incrementUsage(id: string): Promise<void> {
    const script = await this.getScriptById(id);
    if (script) {
      await this.updateScript(id, {
        metadata: {
          ...script.metadata,
          usageCount: script.metadata.usageCount + 1
        }
      });
    }
  }
  
  // 템플릿 관리
  async getAllTemplates(): Promise<ScriptTemplate[]> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(this.templatesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return this.getDefaultTemplates();
    }
  }
  
  async getTemplateById(id: string): Promise<ScriptTemplate | null> {
    const templates = await this.getAllTemplates();
    return templates.find(template => template.id === id) || null;
  }
  
  private async saveScripts(scripts: SampleScript[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    // 디렉토리가 없으면 생성
    const dir = path.dirname(this.scriptsPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(this.scriptsPath, JSON.stringify(scripts, null, 2));
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private getDefaultTemplates(): ScriptTemplate[] {
    return [
      {
        id: 'tutorial-basic',
        name: '기본 튜토리얼',
        description: '단계별 설명이 포함된 튜토리얼 형식',
        structure: {
          sections: [
            {
              name: '도입부',
              description: '문제 제기 및 목표 제시',
              minDuration: 5,
              maxDuration: 10,
              required: true,
              aiPrompt: '시청자의 관심을 끌고 해결할 문제를 명확히 제시하세요.'
            },
            {
              name: '단계별 설명',
              description: '순차적인 해결 과정',
              minDuration: 20,
              maxDuration: 40,
              required: true,
              aiPrompt: '각 단계를 명확하고 따라하기 쉽게 설명하세요.'
            },
            {
              name: '마무리',
              description: '요약 및 추가 팁',
              minDuration: 5,
              maxDuration: 10,
              required: true,
              aiPrompt: '핵심 내용을 요약하고 유용한 팁을 제공하세요.'
            }
          ],
          totalDuration: 50,
          flexibility: 'moderate'
        },
        aiGuidelines: {
          contentGuidelines: [
            '구체적이고 실행 가능한 단계 제시',
            '전문 용어 사용 시 설명 포함',
            '시각적 요소 활용 방안 제시'
          ],
          styleGuidelines: [
            '친근하고 이해하기 쉬운 톤',
            '적극적이고 격려하는 어조',
            '간결하면서도 명확한 표현'
          ],
          lengthGuidelines: [
            '총 30-60초 분량',
            '각 단계는 5-15초 내외',
            '핵심 메시지 우선 순위 고려'
          ]
        }
      },
      {
        id: 'review-product',
        name: '제품 리뷰',
        description: '제품의 장단점을 균형있게 분석하는 리뷰 형식',
        structure: {
          sections: [
            {
              name: '제품 소개',
              description: '제품 개요 및 첫인상',
              minDuration: 8,
              maxDuration: 12,
              required: true,
              aiPrompt: '제품의 핵심 특징과 첫인상을 생생하게 전달하세요.'
            },
            {
              name: '상세 분석',
              description: '기능별 상세 평가',
              minDuration: 25,
              maxDuration: 35,
              required: true,
              aiPrompt: '각 기능을 객관적으로 평가하고 실제 사용 경험을 포함하세요.'
            },
            {
              name: '종합 평가',
              description: '장단점 정리 및 추천 여부',
              minDuration: 7,
              maxDuration: 13,
              required: true,
              aiPrompt: '공정한 종합 평가와 구체적인 추천 대상을 제시하세요.'
            }
          ],
          totalDuration: 50,
          flexibility: 'moderate'
        },
        aiGuidelines: {
          contentGuidelines: [
            '객관적이고 균형잡힌 평가',
            '실제 사용 경험과 구체적 예시',
            '장단점의 명확한 구분'
          ],
          styleGuidelines: [
            '신뢰할 수 있는 전문적 톤',
            '공정하고 솔직한 어조',
            '근거가 명확한 평가'
          ],
          lengthGuidelines: [
            '총 30-60초 분량',
            '중요 기능에 충분한 시간 할당',
            '핵심 포인트 강조'
          ]
        }
      }
    ];
  }
}

export const scriptDatabase = new ScriptDatabase();