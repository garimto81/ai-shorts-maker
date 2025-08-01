import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import ModernShortsCreator from '@/components/modern-shorts-creator';
import { TestTube, Settings, Video, Play, Github, Globe, Upload, Zap, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, X } from 'lucide-react';
import { useState, useCallback } from 'react';

interface SortableImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

const HomePage: NextPage = () => {
  const [isHovered, setIsHovered] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [images, setImages] = useState<SortableImage[]>([]);
  const [sortMode, setSortMode] = useState<'original' | 'ascending' | 'descending' | 'manual'>('original');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages: SortableImage[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}_${index}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setImages(newImages);
  }, []);

  // 이미지 정렬
  const sortImages = useCallback((mode: typeof sortMode) => {
    setSortMode(mode);
    
    if (mode === 'original') {
      // 원래 순서로 복원 (파일 업로드 순서)
      setImages(prev => [...prev].sort((a, b) => a.id.localeCompare(b.id)));
    } else if (mode === 'ascending') {
      setImages(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    } else if (mode === 'descending') {
      setImages(prev => [...prev].sort((a, b) => b.name.localeCompare(a.name)));
    }
    // manual 모드는 드래그앤드롭으로 처리
  }, []);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    
    setImages(newImages);
    setSortMode('manual');
    setDraggedIndex(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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
          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
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
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">온라인 지원</h3>
              <p className="text-gray-300">
                GitHub Actions와 Vercel을 통한 완전 자동화된 온라인 비디오 생성 지원.
              </p>
            </div>
          </div>

          {/* Live Demo Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-4">🎨 이미지 정렬 데모</h2>
              <p className="text-gray-300 mb-4">
                실제로 이미지를 업로드하고 다양한 방식으로 정렬해보세요
              </p>
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showDemo ? '데모 숨기기' : '데모 시작하기'}
              </button>
            </div>

            {showDemo && (
              <div className="space-y-6">
                {/* 파일 업로드 */}
                <div className="bg-white/5 rounded-lg p-6">
                  <label className="block text-white font-semibold mb-3">
                    이미지 업로드 (최대 10개)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                </div>

                {/* 정렬 컨트롤 */}
                {images.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-3">정렬 옵션</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        onClick={() => sortImages('original')}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          sortMode === 'original'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        원본 순서
                      </button>
                      <button
                        onClick={() => sortImages('ascending')}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                          sortMode === 'ascending'
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                        오름차순
                      </button>
                      <button
                        onClick={() => sortImages('descending')}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                          sortMode === 'descending'
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                        내림차순
                      </button>
                      <button
                        onClick={() => setSortMode('manual')}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                          sortMode === 'manual'
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <GripVertical className="w-4 h-4" />
                        수동 정렬
                      </button>
                    </div>

                    {/* 이미지 그리드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={image.id}
                          className={`relative group bg-white/10 rounded-lg overflow-hidden ${
                            sortMode === 'manual' ? 'cursor-move' : ''
                          } ${draggedIndex === index ? 'opacity-50' : ''}`}
                          draggable={sortMode === 'manual'}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <div className="aspect-square">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          </div>
                          
                          {/* 순서 번호 */}
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                          
                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          {/* 드래그 핸들 */}
                          {sortMode === 'manual' && (
                            <div className="absolute bottom-2 right-2 text-white/70">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          
                          {/* 파일명 */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>

                    {images.length > 0 && (
                      <div className="mt-4 text-center">
                        <p className="text-gray-300 text-sm">
                          {sortMode === 'manual' && '드래그하여 순서를 변경하세요'}
                          {sortMode === 'ascending' && '파일명 오름차순으로 정렬됨'}
                          {sortMode === 'descending' && '파일명 내림차순으로 정렬됨'}
                          {sortMode === 'original' && '업로드 순서로 정렬됨'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">빠른 시작</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/video-maker">
                <div className="bg-purple-600/20 rounded-lg p-4 hover:bg-purple-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">🎥 간단 비디오 만들기</h3>
                  <p className="text-gray-300">이미지를 업로드하고 비디오로 변환하세요</p>
                </div>
              </Link>
              
              <Link href="/sorting-demo">
                <div className="bg-green-600/20 rounded-lg p-4 hover:bg-green-600/30 transition-colors cursor-pointer">
                  <h3 className="text-xl font-semibold text-white mb-2">🎨 이미지 정렬 데모</h3>
                  <p className="text-gray-300">이미지를 업로드하고 순서를 정렬해보세요</p>
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