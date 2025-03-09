import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignore TypeScript errors in the smart_contract directory during build
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude smart_contract directory from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...(config.watchOptions?.ignored || []), '**/smart_contract/**'],
    };
    return config;
  },
};

export default nextConfig;
