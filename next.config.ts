import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";
import { IMAGE_REMOTE_HOSTS } from "./lib/image-hosts";

const withBundleAnalyzer = createBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

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
  // Image Optimization is fully off Vercel's meter (see lib/image-loader.ts for the why).
  // Hobby allows 5.000 transformasi/bulan and bills one on every cache MISS *and STALE*; with
  // Supabase Storage sending `cache-control: no-cache` the effective TTL was minimumCacheTTL
  // (60 s), so each variant was re-billed every minute until `/_next/image` started returning 402.
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    // Kept in sync with the Media module's validator even though a custom loader bypasses
    // remotePatterns — so reverting to the built-in optimizer stays a one-line change.
    remotePatterns: IMAGE_REMOTE_HOSTS,
    // Trimmed from the 8+8 defaults: every extra entry is another srcset candidate (and, if the
    // built-in optimizer is ever re-enabled, another billable transformation).
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [96, 192, 384],
    qualities: [75],
    formats: ["image/webp"],
    minimumCacheTTL: 2678400, // 31 hari — Vercel's own recommendation for reducing transformations
  },
};

export default withBundleAnalyzer(nextConfig);
