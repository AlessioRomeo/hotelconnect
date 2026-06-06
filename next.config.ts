import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing on a phone over the local network (e.g. an iPhone hotspot,
  // where this Mac is 172.20.10.x). Next 16 blocks cross-origin dev resources
  // (HMR + JS chunks) by default, which leaves the phone stuck on the loading
  // screen. Dev-only; has no effect on the production build. If the hotspot
  // assigns a different IP, add it here and restart `npm run dev`.
  allowedDevOrigins: ["172.20.10.13"],
};

export default nextConfig;
