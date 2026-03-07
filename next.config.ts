import type { NextConfig } from "next";
import path from "node:path";
import { getAliasRedirects } from "./src/lib/routing/aliases";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return getAliasRedirects();
  },
};

export default nextConfig;
