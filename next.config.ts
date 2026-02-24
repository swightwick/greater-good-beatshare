import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // unsafe-eval required by @react-three/fiber (GLSL shader compilation) and WaveSurfer
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  // blob: for WaveSurfer audio object URLs; https: for Vercel Blob CDN audio
  "media-src 'self' blob: https:",
  // connect-src covers fetch() calls to Vercel Blob CDN and API routes
  "connect-src 'self' https: wss: blob:",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
