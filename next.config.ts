import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    loader: "custom",
    loaderFile: "./loader-wsrv.ts", // or "./loader-coolify.ts"
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
