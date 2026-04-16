import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Pages এর জন্য কনফিগারেশন */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Cloudflare এ image optimization না করলেও চলে
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
