import type { NextConfig } from "next";

// Static export only for production builds. In dev we keep the normal dynamic
// server so unenumerated SPA paths (/blog/<id>, unknown URLs) serve the app
// shell instead of crashing with E443; production builds still emit `out/`.
const isProdBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment
  output: isProdBuild ? "export" : undefined,
  
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

  // Allow these origins for cross-origin requests in development
  // (silences the "Cross origin request detected" dev warning)
  allowedDevOrigins: [
    "preview-chat-a6a07bd1-bf7f-422a-9ed7-90abfba9303b.space-z.ai",
    "preview-chat-56d47c88-50fa-435c-9fbe-faa1d3f62169.space-z.ai",
    "localhost:3000",
  ],

  // Disable the Next.js dev indicator (the corner badge/compile spinner).
  // The site must NEVER show any page-loading/progress UI — not even in dev.
  devIndicators: false,
};

export default nextConfig;
