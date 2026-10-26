import type { NextConfig } from "next";

// No images.remotePatterns: next/image only loads local files from public/images.
// Site photos are S3 presigned URLs rendered with a plain <img>.
const nextConfig: NextConfig = {
  output: 'standalone',
  // Dev only: when the dev server is reached through an SSH tunnel or a proxy,
  // the browser origin can be 127.0.0.1 instead of localhost, which Next blocks
  // by default (it stops hot reload, not the app).
  allowedDevOrigins: ['127.0.0.1'],

  // togeojson is CommonJS and resolves @xmldom/xmldom with a runtime require.
  // Keep both outside the bundler so that require still works on the server.
  serverExternalPackages: ['@mapbox/togeojson', '@xmldom/xmldom'],
};

export default nextConfig;
