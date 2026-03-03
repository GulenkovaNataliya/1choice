import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
