import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  LearnDatabase,
  LearnPath,
  LearnPathLesson,
  LearnSyllabusSection,
  LessonPathContext,
} from "@/lib/learn/types";

// Cache tags (§7.4). There is NO time-based revalidation anywhere in this
// codebase — an untagged query is stale forever:
//   learn          collection tag, shared with the lesson queries and the hub.
//   jalur:{slug}   one path page, including its syllabus.
// A LESSON mutation must fire `jalur:{slug}` for every path it belongs to, not
// just `learn:{slug}` — see the invariant note on getLearnPathLessons() and the
// fan-out in lib/actions/admin/articles.ts.
const LEARN_TAG = "learn";

// The generated Database predates the Learn schema (see lib/learn/types.ts).
function learnClient(): SupabaseClient<LearnDatabase> {
  return createPublicClient() as unknown as SupabaseClient<LearnDatabase>;
}

/** Every published JALUR, in editorial order. */
export function getLearnPaths(): Promise<LearnPath[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase.from("v_learn_paths").select("*").order("sort_order");
      return data ?? [];
    },
    ["learn-paths"],
    { tags: [LEARN_TAG] },
  )();
}

/** One published JALUR at /learn/jalur/{slug}. Null while it is still a draft. */
export function getLearnPath(slug: string): Promise<LearnPath | null> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_learn_paths")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data ?? null;
    },
    ["learn-path", slug],
    { tags: [LEARN_TAG, `jalur:${slug}`] },
  )();
}

/** Slugs only — for generateStaticParams. */
export function getLearnPathSlugs(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase.from("v_learn_paths").select("slug").order("sort_order");
      return (data ?? []).map((row) => row.slug);
    },
    ["learn-path-slugs"],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * The syllabus of one path, in sort_key order.
 *
 * INVARIANT — v_learn_path_lessons joins published articles AND published paths,
 * so an unpublished lesson does not come back as an empty slot: it VANISHES.
 * Absence is unrepresentable. Callers render exactly what this returns — never
 * a placeholder, a greyed row, a "coming soon" step or a count taken from the
 * base join table. The consequence to keep in mind: unpublishing a lesson
 * silently shortens every path that lists it, which is why a lesson mutation
 * must fire `jalur:{slug}` for each of its paths (§7.4) — nothing in the path
 * row itself changed, so no other tag would catch it.
 */
export function getLearnPathLessons(pathSlug: string): Promise<LearnPathLesson[]> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data } = await supabase
        .from("v_learn_path_lessons")
        .select("*")
        .eq("path_slug", pathSlug)
        .order("sort_key");
      return data ?? [];
    },
    ["learn-path-lessons", pathSlug],
    { tags: [LEARN_TAG, `jalur:${pathSlug}`] },
  )();
}

/**
 * Breadcrumb + prev/next for a lesson, resolved through its one primary path
 * (`learn_path_lessons_primary_ux` makes "one" a database guarantee).
 *
 * Returns null when the lesson has no primary path, or when that path is still
 * a draft — a legitimate state, not an error: paths below five published
 * lessons must stay unpublished, and their lessons ship as orphans at flat
 * /learn/{slug}. The lesson template must render without this, not around it.
 *
 * Tagged `learn` only: the path slug is a result of the query, not an input, so
 * it cannot appear in the tag list. `learn` is fired by every lesson and path
 * mutation, so the entry is still busted correctly.
 */
export function getLessonPrimaryPath(articleId: string): Promise<LessonPathContext | null> {
  return unstable_cache(
    async () => {
      const supabase = learnClient();
      const { data: primary } = await supabase
        .from("v_learn_path_lessons")
        .select("*")
        .eq("article_id", articleId)
        .eq("is_primary", true)
        .maybeSingle();
      if (!primary) return null;

      const [{ data: path }, { data: steps }] = await Promise.all([
        supabase.from("v_learn_paths").select("*").eq("id", primary.path_id).maybeSingle(),
        supabase
          .from("v_learn_path_lessons")
          .select("*")
          .eq("path_id", primary.path_id)
          .order("sort_key"),
      ]);
      if (!path) return null;

      const resolved = steps ?? [];
      const index = resolved.findIndex((step) => step.article_id === articleId);
      if (index < 0) return null;

      return {
        path,
        steps: resolved,
        position: index + 1,
        total: resolved.length,
        current: resolved[index] ?? primary,
        previous: resolved[index - 1] ?? null,
        next: resolved[index + 1] ?? null,
      };
    },
    ["learn-lesson-primary-path", articleId],
    { tags: [LEARN_TAG] },
  )();
}

/**
 * Every path slug a lesson belongs to, published or not, read with service-role
 * against the BASE join table.
 *
 * Deliberately uncached and deliberately not the published view: this exists
 * only to feed the `revalidateTag('jalur:{slug}')` fan-out in saveArticle, and
 * that fan-out must fire for a path whose page is affected even when the lesson
 * is being unpublished or the path row is a draft. Caching it would mean
 * invalidation depends on a cache entry that the same mutation invalidates.
 */
export async function listPathSlugsForLesson(articleId: string): Promise<string[]> {
  const admin = createAdminClient() as unknown as SupabaseClient<LearnDatabase>;
  const { data: joins } = await admin
    .from("learn_path_lessons")
    .select("path_id")
    .eq("article_id", articleId);

  const pathIds = [...new Set((joins ?? []).map((row) => row.path_id))];
  if (pathIds.length === 0) return [];

  const { data: paths } = await admin.from("learn_paths").select("slug").in("id", pathIds);
  return (paths ?? []).map((row) => row.slug);
}

/**
 * Split a syllabus into `section_label` groups. ADJACENCY IS THE RULE: a label
 * that reappears after a different label starts a new group, because
 * `section_label` is a presentational run marker, not a key. Grouping by value
 * instead would silently reorder the editor's syllabus.
 */
export function groupSyllabusSections(
  lessons: readonly LearnPathLesson[],
): LearnSyllabusSection[] {
  const sections: LearnSyllabusSection[] = [];
  for (const lesson of lessons) {
    const last = sections[sections.length - 1];
    if (last && last.label === lesson.section_label) {
      last.lessons.push(lesson);
    } else {
      sections.push({ label: lesson.section_label, lessons: [lesson] });
    }
  }
  return sections;
}
