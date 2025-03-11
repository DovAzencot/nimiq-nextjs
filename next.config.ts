import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Configure module rules for WebAssembly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Enhanced module resolution for @nimiq/core
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@nimiq/core': path.resolve('./node_modules/@nimiq/core/bundler/index.js'),
      },
      fallback: {
        ...config.resolve?.fallback,
        path: false,
        fs: false,
      },
      // Add .js extension for ESM imports
      extensions: [...(config.resolve?.extensions || []), '.js', '.mjs'],
    };
    
    return config;
  },
};

export default nextConfig;