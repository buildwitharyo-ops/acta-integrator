import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// 03 §7.4: allow all, disallow admin + API + the noindex compare page; point crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/products/compare"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
