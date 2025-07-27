import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 환경변수 검증 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 AI Shorts Maker 시작');
    }
  }, []);

  return <Component {...pageProps} />
}