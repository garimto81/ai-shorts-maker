import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Info, Chrome, Globe, Zap } from 'lucide-react';

// 클라이언트 사이드에서만 렌더링
const SimpleVideoCreator = dynamic(
  () => import('@/components/simple-video-creator').then(mod => mod.SimpleVideoCreator),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">비디오 생성기 로딩 중...</p>
        </div>
      </div>
    )
  }
);

export default function VideoMakerPage() {
  return (
    <>
      <Head>
        <title>간단 비디오 만들기 - AI Shorts Maker</title>
        <meta name="description" content="이미지를 업로드하고 간단하게 비디오를 만들어보세요" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <a className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span>홈으로</span>
                </a>
              </Link>
              
              <h1 className="text-xl font-bold text-gray-900">
                간단 비디오 만들기
              </h1>
              
              <div className="w-20" /> {/* 레이아웃 균형 */}
            </div>
          </div>
        </header>

        {/* 안내 섹션 */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* 주요 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">사용 방법</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <h3 className="font-medium mb-1">1️⃣ 이미지 준비</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>JPG, PNG 형식 지원</li>
                      <li>최대 20개까지 업로드</li>
                      <li>순서대로 비디오에 나타남</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">2️⃣ 설정 조정</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>해상도: 쇼츠/가로형 선택</li>
                      <li>프레임레이트: 24/30 FPS</li>
                      <li>표시 시간: 1-5초</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 브라우저 호환성 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">권장 브라우저</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                <div>✅ Chrome</div>
                <div>✅ Edge</div>
                <div>✅ Firefox</div>
                <div>⚠️ Safari</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">주요 기능</h3>
              </div>
              <div className="text-sm text-purple-800 space-y-1">
                <div>🎥 WebM 형식 출력</div>
                <div>⚡ 브라우저에서 직접 생성</div>
                <div>🏷️ 자동 워터마크 추가</div>
                <div>📱 모바일 최적화</div>
              </div>
            </div>
          </div>
        </div>

        {/* 비디오 생성기 */}
        <main className="pb-8">
          <SimpleVideoCreator />
        </main>

        {/* 트러블슈팅 */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">문제 해결</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">비디오가 생성되지 않을 때:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Chrome 브라우저 사용</li>
                  <li>브라우저 최신 버전 확인</li>
                  <li>이미지 파일 형식 확인 (JPG/PNG)</li>
                  <li>이미지 크기가 너무 크지 않은지 확인</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">느린 생성 속도:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>이미지 개수 줄이기 (5-10개 권장)</li>
                  <li>이미지 해상도 낮추기</li>
                  <li>다른 탭/프로그램 종료</li>
                  <li>프레임레이트를 24 FPS로 설정</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}