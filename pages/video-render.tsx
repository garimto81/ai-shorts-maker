// 비디오 렌더링 페이지 (v1.6.0)

import React from 'react';
import VideoRendererUI from '@/components/video-renderer-ui';

export default function VideoRenderPage() {
  // 데모용 기본 데이터
  const demoImages = [
    '/api/placeholder/800/600?text=Image1',
    '/api/placeholder/800/600?text=Image2',
    '/api/placeholder/800/600?text=Image3'
  ];

  const demoVideoScript = {
    title: '데모 비디오 스크립트',
    description: '비디오 렌더링 테스트용 스크립트',
    totalDuration: 15,
    scenes: [
      {
        id: 'intro',
        title: '인트로',
        startTime: 0,
        endTime: 5,
        duration: 5
      },
      {
        id: 'main_1', 
        title: '메인 장면 1',
        startTime: 5,
        endTime: 10,
        duration: 5
      },
      {
        id: 'outro',
        title: '아웃트로', 
        startTime: 10,
        endTime: 15,
        duration: 5
      }
    ],
    narration: {
      segments: [
        {
          id: 'narration_1',
          text: '안녕하세요, 이것은 데모 비디오입니다.',
          startTime: 0,
          endTime: 5,
          duration: 5
        },
        {
          id: 'narration_2', 
          text: 'FFmpeg를 사용하여 자동으로 생성되었습니다.',
          startTime: 5,
          endTime: 10,
          duration: 5
        },
        {
          id: 'narration_3',
          text: '감사합니다.',
          startTime: 10,
          endTime: 15,
          duration: 5
        }
      ]
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">비디오 렌더링</h1>
          <p className="text-gray-600">
            FFmpeg를 사용하여 이미지, 오디오, 자막을 합성한 비디오를 생성합니다.
          </p>
        </div>
        
        <VideoRendererUI
          images={demoImages}
          projectTitle="데모 프로젝트"
          videoScript={demoVideoScript}
          onRenderComplete={(result) => {
            console.log('비디오 렌더링 완료:', result);
          }}
        />
      </div>
    </div>
  );
}