import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

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
          sections[row.section_key] = (row.content ?? {}) as Record<string, unknown>;
        }
      }
      return sections;
    },
    ["page-sections", pageKey],
    { tags: [tag] },
  )();
}
