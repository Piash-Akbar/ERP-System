import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': path.resolve('./src/generated/prisma'),
    };
    return config;
  },
};

export default nextConfig;
