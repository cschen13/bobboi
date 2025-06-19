import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  webpack: (config) => {
    // This is needed for Socket.IO client to work properly with webpack 5
    config.externals = [...(config.externals || []), { bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" }];
    return config;
  },
};

export default nextConfig;
