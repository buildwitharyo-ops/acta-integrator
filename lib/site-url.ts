// Single source of truth for the site's public base URL. Powers metadataBase, per-page canonical,
// sitemap, robots, OG images, and every JSON-LD @id. `||` (not `??`) so an EMPTY NEXT_PUBLIC_SITE_URL
// — which .env.local currently has — also falls back to localhost instead of producing `new URL("/","")`.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Resolve a site-relative path to an absolute URL against SITE_URL.
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
