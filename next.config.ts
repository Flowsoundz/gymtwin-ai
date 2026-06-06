import type { NextConfig } from "next";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const CSP = [
  // Allow same-origin content by default
  "default-src 'self'",
  // Next.js App Router requires unsafe-inline for hydration chunks;
  // wasm-unsafe-eval lets MediaPipe WASM JIT-compile without the broader unsafe-eval.
  // We still include unsafe-eval as a fallback for older Chromium builds.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  // Tailwind injects inline styles at runtime
  "style-src 'self' 'unsafe-inline'",
  // Supabase REST + realtime WebSocket; no external image CDNs needed
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
  // Canvas toDataURL() and video frame capture use blob: / data: internally
  "img-src 'self' data: blob:",
  // Camera stream objects
  "media-src 'self' blob:",
  // MediaPipe WASM workers run as inline blob: workers
  "worker-src 'self' blob:",
  // Local fonts only
  "font-src 'self'",
  // Prevents the app from being embedded — blocks canvas-scraping iframes
  "frame-ancestors 'none'",
  // Lock down navigation targets
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Redundant with frame-ancestors but covers older browsers
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URL in Referer header when navigating cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera restricted to same-origin only; microphone/geolocation blocked
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Explicit MIME types for 3D assets and PWA manifest — required with
      // nosniff header so the browser doesn't reject these as octet-stream.
      {
        source: "/models/:path*.glb",
        headers: [{ key: "Content-Type", value: "model/gltf-binary" }],
      },
      {
        source: "/mediapipe/:path*",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
};

export default nextConfig;
