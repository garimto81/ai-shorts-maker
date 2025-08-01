import React from 'react';
import Head from 'next/head';
import ModernShortsCreator from '@/components/modern-shorts-creator';

export default function SortingDemoPage() {
  return (
    <>
      <Head>
        <title>이미지 정렬 데모 - AI Shorts Maker</title>
        <meta name="description" content="AI Shorts Maker의 이미지 정렬 기능을 테스트해보세요" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ModernShortsCreator />
    </>
  );
}