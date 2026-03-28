/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pptxgenjs"],
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
