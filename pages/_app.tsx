import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 환경변수 검증 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 AI Shorts Maker v2.0.1 시작');
    }
  }, []);

  return (
    <>
      <Head>
        <title>AI Shorts Maker v2.0.1 - 파일 정렬 기능</title>
        <meta name="description" content="이미지 파일을 업로드하고 4가지 방식으로 정렬할 수 있는 AI 비디오 제작 도구" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}