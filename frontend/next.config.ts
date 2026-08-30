import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server refuses requests from hosts it does not know, which blocks
  // opening the app over a LAN address (phone, second machine). Set
  // DEV_ORIGINS to a comma-separated list to allow more.
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? "192.168.0.137")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
};

export default nextConfig;
