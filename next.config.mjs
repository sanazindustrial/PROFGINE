/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
