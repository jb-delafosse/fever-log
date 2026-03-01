import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Empty turbopack config to silence Next.js 16 warning
  // Serwist uses webpack, so production builds will use webpack
  turbopack: {},
  // Output standalone build for Docker deployment
  output: 'standalone',
};

export default withSerwist(nextConfig);
