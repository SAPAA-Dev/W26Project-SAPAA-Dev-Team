import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub
      },
      {
        protocol: 'https',
        hostname: 'your-project-id.supabase.co', // Supabase storage
      },
    ],
  },
};

export default nextConfig;
