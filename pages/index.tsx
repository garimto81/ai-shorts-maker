import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import IntelligentFileSorterUI from '@/components/intelligent-file-sorter-ui';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, Zap, Camera, Video, FileImage, ArrowRight } from 'lucide-react';

const HomePage: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  return (
    <>
      <Head>
        <title>AI Shorts Maker v1.8.0 - 혁신적인 3단계 하이브리드 AI 분석</title>
        <meta name="description" content="실제 이미지 내용 AI 분석으로 완벽한 순서 정렬을 구현한 차세대 영상 제작 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* 배경 애니메이션 요소들 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* 네비게이션 헤더 */}
        <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  AI Shorts Maker v1.8.0
                </h1>
                <span className="px-2 py-1 text-xs bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full font-semibold animate-pulse">
                  NEW
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <FileImage className="w-4 h-4 mr-2" />
                    파일 정렬
                  </Button>
                </Link>
                <Link href="/scripts">
                  <Button variant="ghost" className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <Brain className="w-4 h-4 mr-2" />
                    스크립트 관리
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="ghost" className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <Zap className="w-4 h-4 mr-2" />
                    설정
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 히어로 섹션 */}
        <div className={`relative z-10 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-900 to-purple-900 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  혁신적인
                </span>
                <br />
                <span className="text-white">AI 영상 제작</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-4xl mx-auto leading-relaxed">
                <span className="font-semibold text-yellow-300">실제 이미지 내용</span>을 AI가 직접 분석하여<br />
                <span className="font-semibold text-green-300">100% 신뢰도</span>로 완벽한 순서 정렬을 구현
              </p>

              {/* 새로운 기능 하이라이트 */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <Brain className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">3단계 하이브리드 AI</h3>
                  <p className="text-blue-200 text-sm">파일명 + 이미지내용 + 패턴 분석 통합</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <Camera className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">실제 이미지 분석</h3>
                  <p className="text-blue-200 text-sm">Gemini Vision으로 장면 내용 인식</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <Zap className="w-12 h-12 text-pink-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">동적 가중치</h3>
                  <p className="text-blue-200 text-sm">신뢰도 기반 자동 최적화</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                  onClick={() => document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Video className="w-5 h-5 mr-2" />
                  지금 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="flex items-center space-x-2 text-green-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">v1.8.0 최신 버전 사용 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 애플리케이션 */}
        <div id="main-app" className="relative z-10">
          <div className="bg-white/5 backdrop-blur-sm border-t border-white/10">
            <IntelligentFileSorterUI />
          </div>
        </div>

        {/* 추가 CSS 애니메이션 */}
        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .animate-blob {
            animation: blob 7s infinite;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}</style>
      </div>
    </>
  );
};

export default HomePage;