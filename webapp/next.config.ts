import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()

const nextConfig: NextConfig = {
  output: 'standalone',
  // togeojson is CommonJS and resolves @xmldom/xmldom with a runtime require.
  // Keep both outside the bundler so that require still works on the server.
  serverExternalPackages: ['@mapbox/togeojson', '@xmldom/xmldom'],
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
