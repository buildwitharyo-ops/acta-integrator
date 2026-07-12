import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const getSiteSettings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("v_site_settings").select("*").maybeSingle();
    return data;
  },
  ["site-settings"],
  { tags: ["settings"] },
);

export type SiteSettings = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;
