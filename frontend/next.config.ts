import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bpnxarzyaypcswtqeqpx.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
