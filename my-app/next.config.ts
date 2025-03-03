import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {},
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
