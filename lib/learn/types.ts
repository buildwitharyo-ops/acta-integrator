// Hand-written row contract for the Learn schema
// (02-DATA-SEO-AND-CMS.md §7.1 · §7.2).
//
// WHY HAND-WRITTEN: `supabase gen types` needs network access to the remote
// project, which this environment does not have, so lib/supabase/types.ts does
// not know about learn_paths, learn_path_lessons, learn_tools, the three v_learn_*
// views, or articles.reviewed_at. These types are the contract instead — every
// Learn page, component and admin action codes against this file.
//
// TWO DELIBERATE DIVERGENCES from what `supabase gen types` would emit:
//
//  1. NULLABILITY IS HONEST. The generator marks every column of every view as
//     nullable because Postgres cannot prove otherwise through a view. Here a
//     column is `T | null` only when the underlying column, join or CHECK
//     actually allows null. `published_at` on a published row is a good example:
//     `check (status <> 'published' or published_at is not null)` plus a view
//     that filters `status = 'published'` makes it provably non-null.
//  2. `LearnLesson.type` is narrowed to the literal `"learn"`. Every query in
//     lib/queries/learn/* filters `.eq("type", "learn")`; the query layer is what
//     makes the narrowing true, so do not read v_articles through LearnDatabase
//     without that filter.
//
// When someone can finally run `supabase gen types`, keep this file: the honest
// nullability is worth more than the generated churn. Reconcile, do not delete.

import type { Json } from "@/lib/supabase/types";
import type { LearnRoleId } from "@/lib/learn/roles";

export type { LearnRoleId };

/** `learn_level` enum. Still populated, deliberately no longer rendered (§6.3). */
export type LearnLevel = "dasar" | "menengah";

/**
 * The two `pub_status` values Learn content is allowed to hold. `scheduled` and
 * `archived` exist in the enum but are rejected by
 * `check (status in ('draft','published'))` on both learn tables.
 */
export type LearnPublishStatus = "draft" | "published";

// ── v_learn_paths ───────────────────────────────────────────────────────────

/** One JALUR: the pillar page, topic hub and syllabus, at /learn/jalur/{slug}. */
export type LearnPath = {
  id: string;
  slug: string;
  title: string;
  /** Mono eyebrow, e.g. "JALUR 01". */
  eyebrow: string | null;
  /** Outcome, not description. <=180 chars, enforced by CHECK. */
  promise: string;
  intro_md: string;
  /** 3–5 outcomes. Never null — `not null default '{}'`. */
  outcome_bullets: string[];
  /** Bare role id, no "role:" prefix. See lib/learn/roles.ts. */
  role: LearnRoleId;
  /** Soft bridge to /solutions/{slug}. No FK, so it can dangle. */
  solution_slug: string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  /** Non-null: the view only exposes published rows, and a CHECK ties the two. */
  published_at: string;
  /** All four cover_* are null together when cover_media_id is null (LEFT JOIN). */
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  cover_image_alt: string | null;
  cover_is_placeholder: boolean | null;
};

// ── v_learn_path_lessons ────────────────────────────────────────────────────

/**
 * One step of a syllabus: the join row flattened with the lesson and path it
 * resolves to. The view joins published articles AND published paths, so an
 * unpublished lesson does not appear at all — there is no "unresolved step"
 * state to render. See lib/queries/learn/paths.ts.
 */
export type LearnPathLesson = {
  path_id: string;
  article_id: string;
  /**
   * Fractional order key. Arrives as a JS number and that is safe *to read*;
   * never compute a new one here — `public.reorder_path_lesson()` owns writes
   * because float64 reintroduces the exhaustion bug `numeric` prevents (§6.4).
   */
  sort_key: number;
  /** THE "module": adjacent rows sharing a label render as one group heading. */
  section_label: string | null;
  is_primary: boolean;
  /** Lesson columns — the lesson itself lives at flat /learn/{slug}. */
  slug: string;
  title: string;
  excerpt: string;
  level: LearnLevel | null;
  reading_time: number | null;
  tags: string[];
  published_at: string;
  /** Drives "Ditinjau {BULAN YYYY}" (§9.5). Null = never technically re-read. */
  reviewed_at: string | null;
  /** Path columns, denormalised for breadcrumbs without a second round trip. */
  path_slug: string;
  path_title: string;
};

/** A `section_label` run, ready to render as one syllabus group. */
export type LearnSyllabusSection = {
  /** null = the ungrouped run before the first labelled step. */
  label: string | null;
  lessons: LearnPathLesson[];
};

/**
 * Breadcrumb + prev/next for a lesson, resolved through its ONE primary path
 * (`learn_path_lessons_primary_ux`). Null when the lesson has no primary path,
 * or when that path is still a draft — a legitimate state: the lesson publishes
 * as an orphan at flat /learn/{slug}, which costs nothing (§8.1).
 */
export type LessonPathContext = {
  path: LearnPath;
  /** The syllabus, in order, already filtered to resolvable steps. */
  steps: LearnPathLesson[];
  /** 1-based position of this lesson within `steps`. */
  position: number;
  /** `steps.length` — the honest denominator for "Pelajaran 3 dari 7". */
  total: number;
  /** The step row for this lesson, carrying its section_label. */
  current: LearnPathLesson;
  previous: LearnPathLesson | null;
  next: LearnPathLesson | null;
};

// ── v_learn_tools ───────────────────────────────────────────────────────────

/** One calculator at /learn/alat/{slug}. Three rows in year one. */
export type LearnTool = {
  id: string;
  slug: string;
  name: string;
  /** Resolved against a frozen client-side Record<string, Component>. */
  component_key: string;
  intro_md: string;
  /** The formula, written out. Publish-blocking (§9.3). */
  method_md: string;
  /** e.g. "ANSI/AVIXA V202.01:2016 (DISCAS)". Publish-blocking. */
  standard_ref: string;
  /** What the tool does NOT model. >=2 on a published row, enforced by CHECK. */
  assumptions: string[];
  /** One full Indonesian example. Publish-blocking. */
  worked_example_md: string;
  /** Article slugs. Soft reference, no FK. */
  related_slugs: string[];
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  published_at: string;
};

// ── v_articles, learn-shaped ────────────────────────────────────────────────

/**
 * A published lesson: the v_articles row for `type = 'learn'`, including the
 * `reviewed_at` column appended to that view in 20260722100100.
 * Column list matches the view exactly, so `.select("*")` is exhaustive.
 */
export type LearnLesson = {
  id: string;
  type: "learn";
  slug: string;
  title: string;
  excerpt: string;
  is_featured: boolean;
  /**
   * A published article always has a cover (`check (status not in
   * ('published','scheduled') or cover_media_id is not null)`), so the media
   * LEFT JOIN always matches — but which of path/url_ext is populated depends
   * on `media.kind`, and alt/caption/credit are nullable on the media row.
   */
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  cover_image_alt: string | null;
  cover_caption: string | null;
  cover_credit: string | null;
  cover_is_placeholder: boolean;
  /** Tiptap doc. Walked by components/article/ArticleBody.tsx. */
  body: Json;
  category_id: string | null;
  /** English internal labels (§6.3). Never a slug, an H1 or a <title>. */
  category_name: string | null;
  category_slug: string | null;
  level: LearnLevel | null;
  reading_time: number | null;
  /** role:* + topic + vocabulary, mixed. Read roles via lib/learn/roles.ts. */
  tags: string[];
  published_at: string;
  updated_at: string;
  author_name: string;
  author_role: string | null;
  author_photo_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  /** "Ditinjau {BULAN YYYY}" and JSON-LD dateModified (§9.5). */
  reviewed_at: string | null;
};

// ── Base tables (admin/service-role writes) ─────────────────────────────────

/** `learn_paths` base row. Public reads use LearnPath / v_learn_paths instead. */
export type LearnPathRecord = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  promise: string;
  intro_md: string;
  outcome_bullets: string[];
  role: LearnRoleId;
  cover_media_id: string | null;
  solution_slug: string | null;
  sort_order: number;
  status: LearnPublishStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type LearnPathInsert = {
  id?: string;
  slug: string;
  title: string;
  eyebrow?: string | null;
  promise: string;
  intro_md: string;
  outcome_bullets?: string[];
  role: LearnRoleId;
  cover_media_id?: string | null;
  solution_slug?: string | null;
  sort_order?: number;
  status?: LearnPublishStatus;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
};

export type LearnPathUpdate = Partial<LearnPathInsert>;

/** `learn_path_lessons` base row — composite PK (path_id, article_id). */
export type LearnPathLessonRecord = {
  path_id: string;
  article_id: string;
  sort_key: number;
  section_label: string | null;
  is_primary: boolean;
};

export type LearnPathLessonInsert = {
  path_id: string;
  article_id: string;
  /** No default: let `public.reorder_path_lesson()` produce it. */
  sort_key: number;
  section_label?: string | null;
  is_primary?: boolean;
};

export type LearnPathLessonUpdate = Partial<LearnPathLessonInsert>;

/** `learn_tools` base row. Admin-write-only by RLS. */
export type LearnToolRecord = {
  id: string;
  slug: string;
  name: string;
  component_key: string;
  intro_md: string;
  method_md: string;
  standard_ref: string;
  assumptions: string[];
  worked_example_md: string;
  related_slugs: string[];
  sort_order: number;
  status: LearnPublishStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type LearnToolInsert = {
  id?: string;
  slug: string;
  name: string;
  component_key: string;
  intro_md: string;
  method_md: string;
  standard_ref: string;
  assumptions?: string[];
  worked_example_md: string;
  related_slugs?: string[];
  sort_order?: number;
  status?: LearnPublishStatus;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
};

export type LearnToolUpdate = Partial<LearnToolInsert>;

/** Args of `public.reorder_path_lesson()`. Null after = head, null before = tail. */
export type ReorderPathLessonArgs = {
  p_path_id: string;
  p_article_id: string;
  p_after_id: string | null;
  p_before_id: string | null;
};

// ── The schema shim the supabase-js client is cast to ───────────────────────
//
// `createPublicClient()` / `createAdminClient()` are typed with the generated
// `Database`, which predates these relations, so addressing them needs a schema
// that knows about them. Cast at the call site:
//
//   const sb = createPublicClient() as unknown as SupabaseClient<LearnDatabase>;
//
// That cast is the ONLY place the generated types and this file meet; it is
// narrow, and it keeps `Database` untouched for every other caller. Once
// `supabase gen types` can run, replace the cast — not this file.

type Relation<Row> = { Row: Row; Relationships: [] };
type Writable<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type LearnDatabase = {
  public: {
    Tables: {
      learn_paths: Writable<LearnPathRecord, LearnPathInsert, LearnPathUpdate>;
      learn_path_lessons: Writable<
        LearnPathLessonRecord,
        LearnPathLessonInsert,
        LearnPathLessonUpdate
      >;
      learn_tools: Writable<LearnToolRecord, LearnToolInsert, LearnToolUpdate>;
    };
    Views: {
      v_learn_paths: Relation<LearnPath>;
      v_learn_path_lessons: Relation<LearnPathLesson>;
      v_learn_tools: Relation<LearnTool>;
      /** Only ever read with `.eq("type", "learn")` — see the header note. */
      v_articles: Relation<LearnLesson>;
    };
    Functions: {
      reorder_path_lesson: { Args: ReorderPathLessonArgs; Returns: number };
    };
  };
};
