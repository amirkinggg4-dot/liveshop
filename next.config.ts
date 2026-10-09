import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* v1.3.2 — حذف نشان «N» ابزار توسعه از اسکرین‌شات‌ها و روی دکمه‌ها */
  devIndicators: false,
};

export default nextConfig;
