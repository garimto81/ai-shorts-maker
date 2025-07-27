import { NextPage } from 'next';
import Head from 'next/head';
import ScriptManagementUI from '@/components/script-management-ui';

const ScriptsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Shorts Maker - 스크립트 관리</title>
        <meta name="description" content="샘플 스크립트 등록 및 AI 기반 스크립트 생성" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ScriptManagementUI />
    </>
  );
};

export default ScriptsPage;