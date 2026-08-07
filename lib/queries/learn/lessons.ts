import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import type { LearnDatabase, LearnLesson } from "@/lib/learn/types";

// Cache tags (§7.4). There is NO time-based revalidation anywhere in this
// codebase — an untagged query is stale forever, so every function below
// declares its tags:
//   learn          collection tag. Unchanged from HUB_TAGS.learn_hub, so the
//                  existing /learn hub invalidation keeps working.
//   learn:{slug}   one lesson. Fired by saveArticle for both new and old slug.
const LEARN_TAG = "learn";

// The generated Database predates the Learn schema and articles.reviewed_at
// (see lib/learn/types.ts for why). One cast, at the boundary.
function learnClient(): SupabaseClient<LearnDatabase> {
  return createPublicClient() as unknown as SupabaseClient<LearnDatabase>;
}

/** Every published lesson, newest first. The /learn hub list. */
export function getLearnLessons(): Promise<LearnLesson[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", "learn")
        .order("published_at", { ascending: false });
      return data ?? [];
    },
    ["learn-lessons"],
    { tags: [LEARN_TAG] },
  )();
}

/** One published lesson at flat /learn/{slug}. Null when draft or absent. */
export function getLearnLesson(slug: string): Promise<LearnLesson | null> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", "learn")
        .eq("slug", slug)
        .maybeSingle();
      return data ?? null;
    },
    ["learn-lesson", slug],
    { tags: [LEARN_TAG, `${LEARN_TAG}:${slug}`] },
  )();
}

/** Slugs only — for generateStaticParams without pulling every body jsonb. */
export function getLearnLessonSlugs(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_articles")
        .select("slug")
        .eq("type", "learn")
        .order("published_at", { ascending: false });
      return (data ?? []).map((row) => row.slug);
    },
    ["learn-lesson-slugs"],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * How many lessons are actually published. This is the P0-4 gate: /learn stays
 * `noindex` until at least six real pages exist, because an indexed hub that
 * renders zero articles is the thin-aggregation pattern that demotes a whole
 * directory. Read it, do not hardcode it — the number moves on its own.
 */
export function getPublishedLessonCount(): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { count } = await supabase
        .from("v_articles")
        .select("id", { count: "exact", head: true })
        .eq("type", "learn");
      return count ?? 0;
    },
    ["learn-lesson-count"],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * Lessons carrying a given tag, newest first. `articles.tags[]` is GIN-indexed
 * (`articles_tags_gin`), so this stays cheap. Accepts role tags too, but the
 * role chip on /learn is a client-side filter (§6.3) — never call this from a
 * route that derives its params from the URL, or you have built /learn/tag/*.
 */
export function getLearnLessonsByTag(tag: string): Promise<LearnLesson[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", "learn")
        .contains("tags", [tag])
        .order("published_at", { ascending: false });
      return data ?? [];
    },
    ["learn-lessons-by-tag", tag],
    { tags: [LEARN_TAG] },
  )();
}
