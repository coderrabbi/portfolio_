import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: {
    workerThreads: true,
    cpus: 2,
    webpackBuildWorker: false,
    useTypeScriptCli: false,
  },
  transpilePackages: ['@gr/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:4000'}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:4000'}/uploads/:path*`,
      },
    ];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }] },
};
export default config;
