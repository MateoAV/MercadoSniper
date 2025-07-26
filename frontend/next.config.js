/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['http2.mlstatic.com', 'mla-s1-p.mlstatic.com', 'mla-s2-p.mlstatic.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000',
  },
  
  // Enable standalone builds for Docker
  output: 'standalone',
  
  // Disable telemetry in production
  telemetry: false,
  
  // Optimize for production
  swcMinify: true,
  
  // Configure redirects and rewrites for API routing
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000'}/ws/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 