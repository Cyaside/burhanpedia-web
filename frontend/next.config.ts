import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:3000"
    return [{ source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` }]
  },
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
};

export default nextConfig;
