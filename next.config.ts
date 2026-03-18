import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pafgoanilvrigiyjyihe.supabase.co",
        pathname: "/storage/v1/render/image/public/property-images/**",
      },
      {
        protocol: "https",
        hostname: "pafgoanilvrigiyjyihe.supabase.co",
        pathname: "/storage/v1/object/public/property-images/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
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
