import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/deals",
        destination: "/1choicedeals",
        permanent: true,
      },
      {
        source: "/golden-visa",
        destination: "/golden-visa-greece",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
