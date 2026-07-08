import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@vkvize/shared'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  allowedDevOrigins: ['10.0.0.1'],
};

export default nextConfig;
