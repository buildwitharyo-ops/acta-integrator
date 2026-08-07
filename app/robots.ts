import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// 03 §7.4: allow all, disallow admin + API + the noindex compare page; point crawlers at the sitemap.
// The permissive `allow` is deliberate and includes AI crawlers (04 §17.0 P0-9): the volume leader in
// this niche returns 403 to non-browser agents, so being cleanly fetchable is a free asymmetry.
// No `host:` key — it is a Yandex-only directive Google ignores, and it can only ever restate (or,
// as it did before P0-1, misstate) the hostname that `sitemap` and every canonical already declare.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/products/compare"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
