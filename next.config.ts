import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Essential performance optimizations for development
  experimental: {
    // Optimize package imports for WAGMI
    optimizePackageImports: ['@wagmi/core', '@wagmi/connectors', 'viem'],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Ignore pino-pretty and other Node.js modules in browser build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Development optimizations
    if (dev) {
      // Faster builds by disabling some optimizations in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config;
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
