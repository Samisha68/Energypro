import { createCivicAuthPlugin } from "@civic/auth/nextjs"
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

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!,
  callbackUrl: '/api/auth/callback',
  loginUrl: '/auth',
  logoutUrl: '/',
  include: ['/dashboard/*', '/api/protected/*'],
  exclude: ['/api/auth/*', '/auth/*', '/'],
});

export default withCivicAuth(nextConfig)