import type { NextConfig } from "next";
import { IMAGE_REMOTE_HOSTS } from "./lib/image-hosts";

// Legacy SEO slugs → new solution routes (03 §5.2/5.3). permanent: true → 308 (≈301).
const legacyRedirects = [
  { source: "/instalasi-audio-visual-gereja", destination: "/solutions/house-of-worship", permanent: true },
  { source: "/smart-classroom-indonesia", destination: "/solutions/smart-classroom-training-room", permanent: true },
  { source: "/sistem-ruang-rapat-cerdas", destination: "/solutions/smart-meeting-room", permanent: true },
  { source: "/instalasi-audio-visual-auditorium", destination: "/solutions/auditorium-performance-hall", permanent: true },
  { source: "/instalasi-audio-visual-cafe", destination: "/solutions/pa-commercial-sound-system", permanent: true },
  { source: "/instalasi-sound-system-lapangan-indoor", destination: "/solutions/sports-entertainment-venue", permanent: true },
  { source: "/studio-podcast-indonesia", destination: "/solutions/broadcast-podcast-studio", permanent: true },
  { source: "/home-entertainment-system-indonesia", destination: "/solutions", permanent: true },
];

const nextConfig: NextConfig = {
  trailingSlash: false,
  async redirects() {
    return legacyRedirects;
  },
  images: {
    remotePatterns: IMAGE_REMOTE_HOSTS,
  },
};

export default nextConfig;
