import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false, dns: false };
    } else {
      config.externals.push('child_process', 'nodemailer');
    }
    return config;
  },
};

export default nextConfig;
