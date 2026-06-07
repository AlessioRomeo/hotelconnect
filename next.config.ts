import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: allow LAN testing from this IP (e.g. iPhone hotspot).
  allowedDevOrigins: ["172.20.10.13"],

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
