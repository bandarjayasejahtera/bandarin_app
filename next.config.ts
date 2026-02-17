import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Canonical client dashboard is at /client; redirect old paths
      { source: "/user/dashboard", destination: "/client", permanent: false },
      { source: "/user/dashboard/:path*", destination: "/client/:path*", permanent: false },
      { source: "/dashboard", destination: "/client", permanent: false },
      { source: "/dashboard/:path*", destination: "/client/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
