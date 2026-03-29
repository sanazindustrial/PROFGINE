/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pptxgenjs", "docx"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "X-Download-Options",
          value: "noopen",
        },
        {
          key: "X-Permitted-Cross-Domain-Policies",
          value: "none",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https: http:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.stripe.com https://accounts.google.com https://*.neon.tech wss://*.neon.tech",
            "frame-src 'self' https://js.stripe.com https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    }, ]
  },
  async redirects() {
    return [{
      source: "/:path*",
      has: [{
        type: "host",
        value: "www.profgenie.ai",
      }, ],
      destination: "https://profgenie.ai/:path*",
      permanent: true,
    }, ]
  },
}

export default nextConfig
