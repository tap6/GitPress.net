import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    // Client navigations reuse RSC payloads for 30s so admin tab switches
    // don't re-hit GitHub on every click. Mutations still call revalidateTag.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Post save can attach a batch of images (one Git commit).
    serverActions: {
      bodySizeLimit: "24mb",
    },
  },
};

export default nextConfig;
