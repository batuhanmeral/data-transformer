import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Keep the build ID embedded in inline scripts stable for CSP hashing.
  generateBuildId: async () => "static",
};

export default nextConfig;
