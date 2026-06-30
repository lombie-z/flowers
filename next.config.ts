import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Album folded into isaacrozsa.com/good-talk — 301 the old subdomain there.
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://www.isaacrozsa.com/good-talk/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
