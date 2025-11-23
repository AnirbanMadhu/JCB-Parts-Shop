import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Add production image optimization
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production: Enable standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Proxy API requests to backend
  async rewrites() {
    // If NEXT_PUBLIC_API_URL is not set (same-origin setup), proxy to backend
    // In production Docker, use internal backend service URL
    // In development, use localhost
    const backendUrl = process.env.INTERNAL_API_URL || 
                      (process.env.NODE_ENV === 'production' 
                        ? 'http://backend:4001' 
                        : 'http://localhost:4001');
    
    // Only rewrite if NEXT_PUBLIC_API_URL is not set (same-origin setup)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  // Compress responses
  compress: true,

  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: process.env.KEEP_CONSOLE !== 'true',
    },
  }),

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

export default nextConfig;
