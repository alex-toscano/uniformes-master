import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Verified separately via `tsc --noEmit`
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
