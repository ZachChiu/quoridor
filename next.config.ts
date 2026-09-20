import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: {
    SITE_URL: process.env.SITE_URL || 'https://quoridorgame.com',
  },
};

export default nextConfig;
