import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/theme-previews/[name]": [
      "../../themes/classic/preview.svg",
      "../../themes/minimal/preview.svg",
      "../../themes/ink/preview.svg",
      "../../themes/quill/preview.svg",
    ],
  },
  experimental: {
    // Client navigations reuse RSC payloads for 3 minutes so admin tab
    // switches don't re-hit GitHub. Mutations still call revalidateTag.
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
    // Post save can attach a batch of images (one Git commit).
    serverActions: {
      bodySizeLimit: "24mb",
    },
  },
};

export default nextConfig;
