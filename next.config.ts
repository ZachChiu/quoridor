import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  env: {
    SITE_URL: process.env.SITE_URL || 'https://quoridorgame.com',
  },
  siteUrl: process.env.SITE_URL || 'https://quoridorgame.com',
};

export default nextConfig;
