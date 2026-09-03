import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment
  output: "export",
  
  // Trailing slash ensures pages like /about/index.html are generated correctly
  trailingSlash: true,
  
  // Disable image optimization for static export as it requires a Node.js server
  images: {
    unoptimized: true,
  },
  
  // Strict TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Enable strict mode to catch bugs during development
  reactStrictMode: true,
  
  // Ensure that static assets are served correctly
  // This helps when deploying to sub-paths if needed
  basePath: "",
};

export default nextConfig;
