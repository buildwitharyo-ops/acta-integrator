import "server-only";
import { unstable_cache } from "next/cache";
import type { HeroContent } from "@/lib/home-hero";
import { mediaUrl } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { normalizeCommercialCopy } from "@/lib/commercial-service-copy";

// Hub page_sections revalidate under their collection tag, not page:{key} (09 §4.2).
const HUB_TAGS: Record<string, string> = {
  solutions_hub: "solutions",
  catalog_hub: "products",
  news_hub: "news",
  learn_hub: "learn",
};

export function getPageSections(pageKey: string) {
  const tag = HUB_TAGS[pageKey] ?? `page:${pageKey}`;
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_page_sections")
        .select("section_key, content")
        .eq("page_key", pageKey);

      const sections: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) {
        if (row.section_key) {
          const content = (row.content ?? {}) as Record<string, unknown>;
          // Retired service copy occurs in these commercial sections only.
          // Hero payloads and educational page content remain untouched.
          const retiredCommercialSection = pageKey === "about" && row.section_key === "pillars";
          sections[row.section_key] = retiredCommercialSection
            ? normalizeCommercialCopy(content)
            : content;
        }
      }
      return sections;
    },
    ["page-sections", pageKey, ...(pageKey === "about" ? ["service-scope-20261123"] : [])],
    { tags: [tag] },
  )();
}

/**
 * The homepage Hero as the OG card needs it: the live CMS copy plus the hero image resolved
 * to a URL.
 *
 * Tagged `page:home` — the exact tag `savePageSection` revalidates — so saving the Hero in
 * admin invalidates the share card along with the page. Without that the card would be frozen
 * at whatever the copy was on the last deploy.
 *
 * `media` is service-role only under RLS, so the image lookup goes through the admin client,
 * the same way the solutions and article hero covers resolve theirs.
 */
export function getHomeHero() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      // v_page_sections filters `is_enabled`, so a Hero switched off falls back to the
      // component's own defaults here too — the card matches a disabled section's render.
      const { data } = await supabase
        .from("v_page_sections")
        .select("content")
        .eq("page_key", "home")
        .eq("section_key", "hero")
        .maybeSingle();

      const content = (data?.content ?? {}) as HeroContent;

      let imageUrl: string | null = null;
      if (content.image_media_id) {
        const admin = createAdminClient();
        const { data: media } = await admin
          .from("media")
          .select("storage_path, external_url, is_placeholder")
          .eq("id", content.image_media_id)
          .maybeSingle();
        // Skip placeholders (03 §7.3: never imply a real project with TO-REPLACE imagery).
        if (media && !media.is_placeholder) {
          imageUrl = mediaUrl({ storage_path: media.storage_path, external_url: media.external_url });
        }
      }

      return { content, imageUrl };
    },
    ["home-hero"],
    { tags: ["page:home"] },
  )();
}
