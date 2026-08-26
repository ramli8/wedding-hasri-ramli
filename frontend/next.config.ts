import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.124.32.210", "10.160.4.99", "*.trycloudflare.com"],
  images: {
    // AVIF lebih kecil dari WebP (~20-30%); fallback otomatis ke WebP.
    formats: ["image/avif", "image/webp"],
    // Foto undangan praktis tidak berubah — cache optimizer 30 hari.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
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
