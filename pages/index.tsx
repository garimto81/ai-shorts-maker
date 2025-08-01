import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import ModernShortsCreator from '@/components/modern-shorts-creator';
import { TestTube, Settings, Video, Play, Github, Globe, Upload, Zap } from 'lucide-react';
import { useState } from 'react';

const HomePage: NextPage = () => {
  const [isHovered, setIsHovered] = useState('');

  return (
    <>
      <Head>
        <title>AI Shorts Maker - 자동 비디오 생성 플랫폼</title>
        <meta name="description" content="AI를 활용한 자동 단편 영상 제작 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
              AI Shorts Maker
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              이미지와 제목만으로 멋진 비디오를 자동 생성
            </p>
            
            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center mb-12">
              <Link href="/test/audio-video-test">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:scale-105 transition-transform flex items-center gap-2"
                  onMouseEnter={() => setIsHovered('demo')}
                  onMouseLeave={() => setIsHovered('')}
                >
                  <Play className="w-5 h-5" />
                  데모 체험하기
                </button>
              </Link>
              
              <a 
                href="https://github.com/garimto81/ai-shorts-maker"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button 
                  className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
              </a>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 hover:bg-white/20 transition-colors">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">간단한 입력</h3>
              <p className="text-gray-300">
                이미지와 제목만 입력하면 AI가 자동으로 스크립트를 생성하고 비디오를 만들어냅니다.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 hover:bg-white/20 transition-colors">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI 파워</h3>
              <p className="text-gray-300">
                Gemini Vision API와 ElevenLabs TTS를 활용한 최첨단 AI 기술로 고품질 콘텐츠 생성.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 hover:bg-white/20 transition-colors">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">온라인 지원</h3>
              <p className="text-gray-300">
                GitHub Actions와 Vercel을 통한 완전 자동화된 온라인 비디오 생성 지원.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">빠른 시작</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/sorting-demo">
                <div className="bg-purple-600/20 rounded-lg p-4 hover:bg-purple-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">🎨 이미지 정렬 데모</h3>
                  <p className="text-gray-300">이미지를 업로드하고 순서를 정렬해보세요</p>
                </div>
              </Link>
              
              <Link href="/video-audio-test">
                <div className="bg-green-600/20 rounded-lg p-4 hover:bg-green-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">🎬 비디오 생성 데모</h3>
                  <p className="text-gray-300">웹에서 바로 비디오를 생성해보세요</p>
                </div>
              </Link>
              
              <Link href="/tts">
                <div className="bg-blue-600/20 rounded-lg p-4 hover:bg-blue-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">🎙️ TTS 테스트</h3>
                  <p className="text-gray-300">다양한 음성 스타일을 테스트해보세요</p>
                </div>
              </Link>
              
              <a 
                href="https://github.com/garimto81/ai-shorts-maker/issues/new?template=video_request.yml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="bg-green-600/20 rounded-lg p-4 hover:bg-green-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">📝 GitHub Issue로 생성</h3>
                  <p className="text-gray-300">Issue를 통해 자동으로 비디오 생성</p>
                </div>
              </a>
              
              <Link href="/docs/ONLINE_SETUP.md">
                <div className="bg-orange-600/20 rounded-lg p-4 hover:bg-orange-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">📚 설정 가이드</h3>
                  <p className="text-gray-300">온라인 환경 설정 방법 확인</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p>© 2024 AI Shorts Maker. Built with Next.js & AI</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </>
  );
};

export default HomePage;