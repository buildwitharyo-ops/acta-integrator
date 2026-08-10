// Custom next/image loader — keeps every image off Vercel's Image Optimization meter.
//
// Why: the Hobby plan allows 5.000 transformasi/bulan, and Vercel bills a transformation on
// every cache MISS *and STALE*. Supabase Storage serves its objects with `cache-control: no-cache`,
// so Next fell back to `minimumCacheTTL` (default 60 detik) — every variant went stale each minute
// and got re-billed. The quota burned out and `/_next/image` now answers 402
// (x-vercel-error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), which is why cards render alt text.
//
// With `images.loader: "custom"` Next never calls `/_next/image` at all:
//   - Supabase Storage objects  → Supabase's own transformer (billed per *origin image*, not per request)
//   - everything else           → served as-is (see ActaLogo: local assets are pre-sized instead)

const OBJECT_PREFIX = "/storage/v1/object/public/";
const RENDER_PREFIX = "/storage/v1/render/image/public/";

// Supabase transform limits: width 1–2500 px, quality 20–100 (docs: storage/serving/image-transformations).
const MAX_WIDTH = 2500;
const MIN_QUALITY = 20;
const MAX_QUALITY = 100;
const DEFAULT_QUALITY = 75;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(n), min), max);
}

export default function actaImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.startsWith("http")) return src; // /public assets and blob:/data: previews

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (!url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith(OBJECT_PREFIX)) {
    return src; // unsplash/pexels/vendor hosts — pass through untouched
  }

  url.pathname = RENDER_PREFIX + url.pathname.slice(OBJECT_PREFIX.length);
  // `resize=contain` is required: with `width` alone Supabase crops to the box instead of scaling.
  url.searchParams.set("width", String(clamp(width, 1, MAX_WIDTH)));
  url.searchParams.set("resize", "contain");
  url.searchParams.set("quality", String(clamp(quality ?? DEFAULT_QUALITY, MIN_QUALITY, MAX_QUALITY)));
  return url.toString();
}
