import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 🚫 忽略构建时的 TypeScript 错误
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
