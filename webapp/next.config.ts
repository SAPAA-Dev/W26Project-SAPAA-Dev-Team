import type { NextConfig } from "next";

// No images.remotePatterns: next/image only loads local files from public/images.
// Site photos are S3 presigned URLs rendered with a plain <img>.
const nextConfig: NextConfig = {
  output: 'standalone',
  // togeojson is CommonJS and resolves @xmldom/xmldom with a runtime require.
  // Keep both outside the bundler so that require still works on the server.
  serverExternalPackages: ['@mapbox/togeojson', '@xmldom/xmldom'],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
