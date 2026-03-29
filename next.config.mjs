/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pptxgenjs", "docx"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{
          key: "X-Content-Type-Options",
          value: "nosniff"
        },
        {
          key: "X-Frame-Options",
          value: "DENY"
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block"
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin"
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()"
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on"
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://js.stripe.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https: http:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://accounts.google.com https://api.stripe.com https://*.neon.tech https://*.vercel.app wss:",
            "frame-src 'self' https://accounts.google.com https://js.stripe.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
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
