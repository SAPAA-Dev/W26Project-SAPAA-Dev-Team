import type { NextConfig } from "next";

// No images.remotePatterns: next/image only loads local files from public/images.
// Site photos are S3 presigned URLs rendered with a plain <img>.
const nextConfig: NextConfig = {
  output: 'standalone',
  // togeojson is CommonJS and resolves @xmldom/xmldom with a runtime require.
  // Keep both outside the bundler so that require still works on the server.
  serverExternalPackages: ['@mapbox/togeojson', '@xmldom/xmldom'],
  // A stray lockfile higher up (e.g. ~/package-lock.json) makes Turbopack pick the
  // wrong workspace root and crawl it. Pin the root to this app.
  turbopack: { root: __dirname },
};

export default nextConfig;
