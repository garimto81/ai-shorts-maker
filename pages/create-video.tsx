import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Info } from 'lucide-react';

// 클라이언트 사이드에서만 렌더링
const VideoCreator = dynamic(
  () => import('@/components/video-creator').then(mod => mod.VideoCreator),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">비디오 생성기 로딩 중...</p>
        </div>
      </div>
    )
  }
);

export default function CreateVideoPage() {
  return (
    <>
      <Head>
        <title>비디오 생성 - AI Shorts Maker</title>
        <meta name="description" content="이미지와 음악으로 멋진 비디오를 만들어보세요" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* 헤더 */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <a className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span>홈으로</span>
                </a>
              </Link>
              
              <h1 className="text-xl font-bold text-gray-900">
                AI 비디오 생성기
              </h1>
              
              <div className="w-20" /> {/* 레이아웃 균형 */}
            </div>
          </div>
        </header>

        {/* 안내 메시지 */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">브라우저 기반 비디오 생성</p>
              <ul className="list-disc list-inside space-y-1">
                <li>이미지를 업로드하고 순서를 정렬하세요</li>
                <li>배경 음악을 추가할 수 있습니다 (선택사항)</li>
                <li>해상도와 프레임레이트를 설정하세요</li>
                <li>쇼츠/릴스에 최적화된 세로형 비디오 지원</li>
                <li>생성된 비디오는 WebM 형식으로 다운로드됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 비디오 생성기 */}
        <main className="py-6">
          <VideoCreator />
        </main>

        {/* 지원 브라우저 안내 */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">지원 브라우저</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
              <div>✅ Chrome (권장)</div>
              <div>✅ Edge</div>
              <div>✅ Firefox</div>
              <div>⚠️ Safari (제한적)</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}