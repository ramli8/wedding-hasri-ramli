import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.124.32.210", "10.160.4.99", "*.trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*', // Proxy to Backend (services sudah include /v1)
      },
    ];
  },
};

export default nextConfig;
