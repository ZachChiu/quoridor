import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  env: {
    SITE_URL: process.env.SITE_URL || 'https://quridor.com',
  },
  siteUrl: process.env.SITE_URL || 'https://quridor.com',
};

export default nextConfig;
