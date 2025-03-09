import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Simple configuration without spread operators
    if (!config.watchOptions) {
      config.watchOptions = {};
    }
    
    config.watchOptions.ignored = ['**/node_modules/**', '**/smart_contract/**'];
    
    return config;
  },
};

export default nextConfig;
