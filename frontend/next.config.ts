import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:3000"
    return [{ source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` }]
  },
  images: {
    remotePatterns: (() => {
      const base = new URL(process.env.IMAGE_PUBLIC_BASE_URL ?? "http://127.0.0.1:9000/burhanpedia-images")
      return [
        {
          protocol: base.protocol.slice(0, -1) as "http" | "https",
          hostname: base.hostname,
          port: base.port,
          pathname: `${base.pathname.replace(/\/$/, "")}/**`,
        },
        {
          protocol: "https" as const,
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https" as const,
          hostname: "cdn.jsdelivr.net",
          pathname: "/gh/hfg-gmuend/openmoji@17.0.0/color/618x618/**",
        },
      ]
    })(),
  },
};

export default nextConfig;
