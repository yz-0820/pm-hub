import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
    qualities: [75, 90],
  },
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        path: false,
        fs: false,
      };
    }
    // 将 Node.js 内置模块标记为外部依赖
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({ crypto: 'commonjs crypto' });
    }
    return config;
  },
};

export default nextConfig;
