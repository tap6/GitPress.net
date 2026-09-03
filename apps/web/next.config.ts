import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/make-theme", destination: "/help/make-theme", permanent: true },
      { source: "/en/make-theme", destination: "/en/help/make-theme", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/.well-known/llms.txt", destination: "/llms.txt" }];
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
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
    serverActions: {
      bodySizeLimit: "24mb",
    },
  },
};

export default withNextIntl(nextConfig);
