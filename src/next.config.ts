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
  // The app lives in src/ but a root-level package.json (for the Supabase
  // CLI devDependency) gives the workspace a second lockfile — pin the
  // Turbopack root here so it doesn't have to guess between the two.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN — replace <your-project-ref> with your actual ref
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
