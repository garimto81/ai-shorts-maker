import { NextPage } from 'next';
import Head from 'next/head';
import SimpleFileSorterUI from '@/components/simple-file-sorter-ui';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Shorts Maker - 파일 정렬 기능 포함</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="이미지 파일을 업로드하고 오름차순, 내림차순, 드래그, 번호 입력으로 정렬할 수 있습니다." />
      </Head>

      <div className="min-h-screen bg-white">
        <SimpleFileSorterUI />
      </div>
    </>
  );
};

export default HomePage;