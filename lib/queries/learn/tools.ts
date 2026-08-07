import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import type { LearnDatabase, LearnTool } from "@/lib/learn/types";

// Cache tags (§7.4). There is NO time-based revalidation anywhere in this
// codebase — an untagged query is stale forever:
//   learn         collection tag, shared with the lesson and path queries.
//   alat:{slug}   one calculator page at /learn/alat/{slug}.
const LEARN_TAG = "learn";

// The generated Database predates the Learn schema (see lib/learn/types.ts).
function learnClient(): SupabaseClient<LearnDatabase> {
  return createPublicClient() as unknown as SupabaseClient<LearnDatabase>;
}

/** Every published calculator, in editorial order. */
export function getLearnTools(): Promise<LearnTool[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase.from("v_learn_tools").select("*").order("sort_order");
      return data ?? [];
    },
    ["learn-tools"],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * One published calculator. Null while it is a draft — which is also how the
 * §9.3 publish gate reads from the outside: a tool without method_md,
 * standard_ref, >=2 assumptions and a worked example cannot reach 'published',
 * so an unpublished tool is a tool that has not shown its work yet.
 */
export function getLearnTool(slug: string): Promise<LearnTool | null> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_learn_tools")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data ?? null;
    },
    ["learn-tool", slug],
    { tags: [LEARN_TAG, `alat:${slug}`] },
  )();
}

/** Slugs only — for generateStaticParams. */
export function getLearnToolSlugs(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase.from("v_learn_tools").select("slug").order("sort_order");
      return (data ?? []).map((row) => row.slug);
    },
    ["learn-tool-slugs"],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * Calculators that name this lesson in `related_slugs`. Soft reference, no FK:
 * a renamed lesson slug leaves a dangling entry rather than blocking the
 * rename, so an empty result is normal and must render as nothing at all.
 */
export function getLearnToolsForLesson(lessonSlug: string): Promise<LearnTool[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_learn_tools")
        .select("*")
        .contains("related_slugs", [lessonSlug])
        .order("sort_order");
      return data ?? [];
    },
    ["learn-tools-for-lesson", lessonSlug],
    { tags: [LEARN_TAG, `${LEARN_TAG}:${lessonSlug}`] },
  )();
}
