import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variable exposed to the browser
  // Set NEXT_PUBLIC_API_URL=http://localhost:8080/api in .env.local
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  },
};

export default nextConfig;
