import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Create a new watchOptions object instead of modifying the existing one
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/smart_contract/**']
    };
    
    return config;
  },
};

export default nextConfig;