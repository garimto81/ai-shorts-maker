/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  basePath: process.env.NODE_ENV === 'production' ? '/ai-shorts-maker' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ai-shorts-maker' : '',
  
  // 이미지 최적화 비활성화 (정적 사이트용)
  images: {
    unoptimized: true,
  },
  
  // 프로덕션 최적화
  compress: true,
  poweredByHeader: false,
  
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai', 'sharp', 'formidable', 'fluent-ffmpeg'],
  },
  
  // Webpack 설정 (Vercel 환경 대응)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        child_process: false,
      };
    }
    
    return config;
  },
  
}

module.exports = nextConfig