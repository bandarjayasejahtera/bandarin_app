import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Fix 404: /user/dashboard/* has no route; redirect to /dashboard/*
      {
        source: "/user/dashboard",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/user/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
