import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import IntelligentFileSorterUI from '@/components/intelligent-file-sorter-ui';
import { Button } from '@/components/ui/button';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Shorts Maker - 지능형 파일 정렬</title>
        <meta name="description" content="AI 기반 자동 단편 영상 제작 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 네비게이션 헤더 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  🎬 AI Shorts Maker
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" className="text-sm">
                    📁 파일 정렬
                  </Button>
                </Link>
                <Link href="/scripts">
                  <Button variant="ghost" className="text-sm">
                    📝 스크립트 관리
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="ghost" className="text-sm">
                    ⚙️ 설정
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 */}
        <main>
          <IntelligentFileSorterUI />
        </main>
      </div>
    </>
  );
};

export default HomePage;