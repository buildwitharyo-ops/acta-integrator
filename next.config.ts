import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "www.crestron.com" },
      { protocol: "https", hostname: "www.qsc.com" },
      { protocol: "https", hostname: "www.shure.com" },
    ],
  },
};

export default nextConfig;
