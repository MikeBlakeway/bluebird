import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bluebird/types', '@bluebird/client', '@heroui/react', '@heroui/theme'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  // Optimize for production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Enable statically typed routes for type-safe navigation
  typedRoutes: true,
}

export default nextConfig
