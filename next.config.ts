import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable Server Actions for Stripe + Supabase flows
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
