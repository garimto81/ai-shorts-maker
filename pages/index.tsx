import { NextPage } from 'next';
import Head from 'next/head';
import SimpleFileSorterUI from '@/components/simple-file-sorter-ui';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Shorts Maker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <SimpleFileSorterUI />
      </div>
    </>
  );
};

export default HomePage;