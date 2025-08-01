// 오디오 기능 사용 가이드 컴포넌트

import React, { useState } from 'react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Mic, 
  Upload, 
  FileAudio, 
  CheckCircle,
  AlertTriangle,
  Volume2
} from 'lucide-react';

interface AudioGuideProps {
  className?: string;
}

export default function AudioGuide({ className = '' }: AudioGuideProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'tts-guide',
      title: 'AI 음성 생성 (TTS) 사용법',
      icon: <Mic className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ TTS 사용 시 장점</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 일관된 음성 품질</li>
              <li>• 다양한 감정과 스타일 선택 가능</li>
              <li>• 빠른 처리 속도</li>
              <li>• 한국어 자연스러운 발음</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">1단계: 음성 설정</h4>
            <p className="text-sm text-gray-600">
              목소리, 감정, 강도를 선택하여 비디오 내용에 맞는 음성을 생성하세요.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2단계: 스크립트 생성</h4>
            <p className="text-sm text-gray-600">
              프로젝트 제목과 설명을 바탕으로 자동으로 TTS 음성이 함께 생성됩니다.
            </p>
          </div>
        </div>
      )
    },
    
    {
      id: 'upload-guide',
      title: '음성 파일 업로드 사용법',
      icon: <Upload className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📂 지원 파일 형식</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">MP3</span>
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">WAV</span>
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">M4A</span>
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">AAC</span>
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">OGG</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">1단계: 파일 준비</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• 최대 파일 크기: 50MB</li>
              <li>• 권장 품질: 48kHz, 16-bit 이상</li>
              <li>• 배경 소음이 적은 깨끗한 음성</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2단계: 파일 업로드</h4>
            <p className="text-sm text-gray-600">
              "음성 파일 업로드" 옵션을 선택하고 파일을 드래그하거나 선택하세요.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3단계: 미리보기</h4>
            <p className="text-sm text-gray-600">
              업로드 후 오디오 플레이어로 음성을 미리 들어볼 수 있습니다.
            </p>
          </div>
        </div>
      )
    },
    
    {
      id: 'tips',
      title: '음성 품질 향상 팁',
      icon: <Volume2 className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">💡 전문가 팁</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 조용한 환경에서 녹음하세요</li>
              <li>• 마이크와 입 사이 거리를 일정하게 유지하세요</li>
              <li>• 말하는 속도를 일정하게 유지하세요</li>
              <li>• 음성 길이를 비디오 시간에 맞춰 조절하세요</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">음성 편집 도구 추천</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Audacity (무료)</li>
              <li>• Adobe Audition (유료)</li>
              <li>• GarageBand (Mac 무료)</li>
            </ul>
          </div>
        </div>
      )
    },
    
    {
      id: 'troubleshooting',
      title: '문제 해결 가이드',
      icon: <AlertTriangle className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">❌ 자주 발생하는 문제</h4>
            
            <div className="border-l-4 border-red-200 pl-3">
              <h5 className="font-medium text-sm">파일 업로드 실패</h5>
              <p className="text-xs text-gray-600">
                해결책: 파일 크기(50MB 미만), 형식(MP3, WAV 등) 확인
              </p>
            </div>
            
            <div className="border-l-4 border-red-200 pl-3">
              <h5 className="font-medium text-sm">음성이 비디오와 길이가 맞지 않음</h5>
              <p className="text-xs text-gray-600">
                해결책: 음성을 편집하여 적절한 길이로 조절하거나 이미지 개수 조정
              </p>
            </div>
            
            <div className="border-l-4 border-red-200 pl-3">
              <h5 className="font-medium text-sm">TTS 음성 생성 실패</h5>
              <p className="text-xs text-gray-600">
                해결책: Azure Speech API 키 확인, 텍스트 길이 확인
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">📞 지원 요청</h4>
            <p className="text-sm text-gray-600">
              문제가 지속되면 관리자 설정에서 시스템 상태를 확인하거나 
              개발팀에 문의하세요.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          오디오 기능 사용 가이드
        </h3>
      </div>
      
      <div className="divide-y">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>
            
            {expandedSection === section.id && (
              <div className="px-4 pb-4">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}