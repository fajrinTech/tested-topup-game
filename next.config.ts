import type { NextConfig } from "next";
import path from "node:path";

const isVercelOrCI = Boolean(process.env.VERCEL || process.env.CI);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercelOrCI
    ? {}
    : {
        turbopack: {
          root: path.resolve(__dirname, ".."),
        },
      }),
};

export default nextConfig;
