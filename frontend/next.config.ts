import { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'openstreetmap.org',
      'tile.openstreetmap.org'
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
  // Add domain redirects for API paths if needed
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default config;