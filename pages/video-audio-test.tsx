// 영상+음성 합성 통합 테스트 페이지

import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import ClientOnly from '../components/ClientOnly';

// 동적 임포트로 클라이언트 전용 컴포넌트 로드
const VideoAudioCompositorUI = dynamic(
  () => import('../components/video-audio-compositor-ui'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">영상 합성 도구 로딩 중...</p>
        </div>
      </div>
    )
  }
);

export default function VideoAudioTestPage() {
  return (
    <>
      <Head>
        <title>영상+음성 합성 테스트 - AI Shorts Maker</title>
        <meta name="description" content="이미지와 음성을 합성하여 영상을 만드는 테스트 페이지" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎬 영상+음성 합성 테스트
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              이미지 파일들과 음성 파일을 업로드하여 자동으로 영상을 생성합니다.
              3가지 렌더링 방식을 지원합니다.
            </p>
          </div>

          <ClientOnly 
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">클라이언트 초기화 중...</p>
                </div>
              </div>
            }
          >
            <VideoAudioCompositorUI />
          </ClientOnly>

          {/* 사용법 가이드 */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📚 사용법 가이드</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-600">1. 파일 선택</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 이미지: JPG, PNG, GIF 등</li>
                    <li>• 음성: MP3, WAV, M4A 등</li>
                    <li>• 여러 이미지 동시 선택 가능</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">2. 설정 조정</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 이미지 표시 시간</li>
                    <li>• 해상도 및 품질</li>
                    <li>• 출력 형식 선택</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-600">3. 렌더링 모드</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 브라우저: 빠른 테스트용</li>
                    <li>• FFmpeg: 고품질 처리</li>
                    <li>• 서버: 최고 품질</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• FFmpeg 모드는 SharedArrayBuffer 지원 브라우저에서만 작동</li>
                  <li>• 서버 모드는 FFmpeg가 설치된 환경에서만 작동</li>
                  <li>• 대용량 파일은 처리 시간이 오래 걸릴 수 있습니다</li>
                  <li>• 브라우저 모드는 WebM 형식으로만 출력됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 기술 정보 */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔧 기술 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">지원되는 렌더링 방식</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Canvas + MediaRecorder API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>FFmpeg WebAssembly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Server-side FFmpeg</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">브라우저 호환성</h3>
                  <div className="space-y-1 text-sm">
                    <div>• Chrome 88+ (권장)</div>
                    <div>• Firefox 90+</div>
                    <div>• Safari 15.4+</div>
                    <div>• Edge 88+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}