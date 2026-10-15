/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV !== "production";

// MediaPipe compiles its WASM at runtime ('wasm-unsafe-eval'); its loader does not use eval.
// 'unsafe-eval' is only needed by the Next.js dev server for fast refresh.
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  "'wasm-unsafe-eval'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  "https://cdn.jsdelivr.net",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSources.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://storage.googleapis.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@mediapipe/tasks-vision"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
