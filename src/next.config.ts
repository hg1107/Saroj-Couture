import path from "node:path";
import type { NextConfig } from "next";

// Content-Security-Policy is set per-request in src/proxy.ts (needs a fresh
// nonce every time, so it can't be a static header here) — everything else
// stays static.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Never ship readable source maps to the browser in production.
  productionBrowserSourceMaps: false,
  // Self-contained server bundle (.next/standalone) for the Docker image.
  // Skipped on Vercel, which does its own packaging and fails with it set.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Pin the Turbopack root to this folder (the repo root above it isn't an npm package).
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Photos are pre-rendered at upload into thumb/medium/large WebP files;
    // this loader just picks the right one per width instead of letting Next
    // re-encode them at lower quality.
    loaderFile: "./lib/image-loader.ts",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
