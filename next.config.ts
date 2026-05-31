import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.woshipm.com',
      },
      {
        protocol: 'https',
        hostname: '**.pmcaff.com',
      },
      {
        protocol: 'https',
        hostname: '**.geekpark.net',
      },
      {
        protocol: 'https',
        hostname: '**.36kr.com',
      },
      {
        protocol: 'https',
        hostname: '**.huxiu.com',
      },
      {
        protocol: 'https',
        hostname: '**.producthunt.com',
      },
      {
        protocol: 'https',
        hostname: '**.mindtheproduct.com',
      },
      {
        protocol: 'https',
        hostname: '**.techcrunch.com',
      },
      {
        protocol: 'https',
        hostname: '**.theverge.com',
      },
      {
        protocol: 'https',
        hostname: '**.ithome.com',
      },
      {
        protocol: 'https',
        hostname: '**.ifanr.com',
      },
      {
        protocol: 'https',
        hostname: '**.mydrivers.com',
      },
      {
        protocol: 'https',
        hostname: '**.sspai.com',
      },
      {
        protocol: 'https',
        hostname: '**.cnbeta.com',
      },
      {
        protocol: 'https',
        hostname: '**.fastcompany.com',
      },
      {
        protocol: 'https',
        hostname: '**.harvardbusinessreview.org',
      },
    ],
    // 启用 Next.js 图片优化（自动压缩、WebP 转换、响应式尺寸）
    // 如需禁用（如 Docker 部署无 sharp），可设为 true
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
