/**
 * The static search payload (03 §14.3, §11.5).
 *
 * At ~30 documents the entire corpus is ~25–30 KB of JSON sitting inside the
 * hub's static HTML. There is no index route, no server round-trip and no
 * two-tier lazy index, because that machinery solves a payload problem that does
 * not exist until roughly 500 documents. The written-down promotion trigger is
 * **120 documents** — at that point this builder moves behind a `force-static`
 * route handler at `/learn/search-index` tagged `learn` + `learn:index`, and
 * nothing else about the search has to change.
 *
 * PURE MODULE. It takes rows a server component already fetched and returns
 * plain data; it does not import `server-only`, does not read the database and
 * holds no React. That is what lets the same function run in a route, in a test
 * and (if it ever needs to) in the browser.
 *
 * The excerpt is TRUNCATED HERE, before matching, so the text that is searched
 * is exactly the text that is displayed. A match the reader cannot see in the
 * result row is a match they do not believe.
 */

import { tagsWithoutRoles } from "@/lib/learn/roles";

/**
 * Group axis. The order of this tuple is the render order of the palette and it
 * is FIXED, never relevance-ranked (§11.5): a stable shape is faster to scan on
 * repeat use and teaches the corpus's structure.
 */
export const SEARCH_KIND_ORDER = ["jalur", "ruang", "pelajaran", "alat", "istilah"] as const;

export type SearchKind = (typeof SEARCH_KIND_ORDER)[number];

/** Group headings, Bahasa Indonesia. */
export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  jalur: "Jalur",
  ruang: "Arsitektur Ruang",
  pelajaran: "Pelajaran",
  alat: "Alat",
  istilah: "Istilah",
};

/** Short badge on a result row. Rendered as a mono label. */
export const SEARCH_KIND_BADGE: Record<SearchKind, string> = {
  jalur: "JALUR",
  ruang: "RUANG",
  pelajaran: "PELAJARAN",
  alat: "ALAT",
  istilah: "ISTILAH",
};

export type SearchDoc = {
  kind: SearchKind;
  /** Slug within its kind. For a glossary entry this is the anchor. */
  slug: string;
  /** Site-relative destination, ready for `router.push`. */
  href: string;
  title: string;
  /** One line of context. Already trimmed to `EXCERPT_MAX`. */
  excerpt: string;
  /** Topical tags only — the machine-readable `role:*` axis is stripped. */
  tags: string[];
};

/** Longest excerpt the payload will carry, in characters. */
export const EXCERPT_MAX = 150;

/* ------------------------------------------------------------------ *
 * Input shapes — structural, so callers can pass query rows directly
 * ------------------------------------------------------------------ */

export type LessonInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  tags?: readonly string[] | null;
};

export type PathInput = {
  slug: string;
  title: string;
  promise?: string | null;
  eyebrow?: string | null;
  role?: string | null;
};

export type ToolInput = {
  slug: string;
  name: string;
  intro_md?: string | null;
  standard_ref?: string | null;
};

export type RoomInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  tags?: readonly string[] | null;
};

export type GlossaryInput = {
  /** The `#anchor` on /learn/glosarium. Also the doc slug. */
  anchor: string;
  term: string;
  definition: string;
  /** English or vendor spellings of the same term. Searchable, never displayed. */
  aliases?: readonly string[] | null;
};

export type SearchCorpusInput = {
  lessons?: readonly LessonInput[];
  paths?: readonly PathInput[];
  tools?: readonly ToolInput[];
  rooms?: readonly RoomInput[];
  glossary?: readonly GlossaryInput[];
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Markdown → one line of plain text. Deliberately small: `intro_md` and
 * `definition` are short prose fields, so link syntax, emphasis, headings and
 * inline code are the only constructs that ever appear.
 */
export function plainText(md: string | null | undefined): string {
  if (!md) return "";
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim to `EXCERPT_MAX` on a word boundary, with an ellipsis when cut. */
export function clampExcerpt(text: string, max = EXCERPT_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]$/, "")}…`;
}

function cleanTags(tags: readonly string[] | null | undefined): string[] {
  return tagsWithoutRoles(tags)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/* ------------------------------------------------------------------ *
 * Per-kind builders
 * ------------------------------------------------------------------ */

export function lessonDoc(lesson: LessonInput): SearchDoc {
  return {
    kind: "pelajaran",
    slug: lesson.slug,
    href: `/learn/${lesson.slug}`,
    title: lesson.title,
    excerpt: clampExcerpt(plainText(lesson.excerpt)),
    tags: cleanTags(lesson.tags),
  };
}

export function pathDoc(path: PathInput): SearchDoc {
  return {
    kind: "jalur",
    slug: path.slug,
    href: `/learn/jalur/${path.slug}`,
    title: path.title,
    excerpt: clampExcerpt(plainText(path.promise ?? path.eyebrow)),
    // The role is a legitimate search term on a jalur — unlike on a lesson,
    // where it is a filter chip — because a jalur is written FOR one role.
    tags: path.role ? [path.role] : [],
  };
}

export function toolDoc(tool: ToolInput): SearchDoc {
  return {
    kind: "alat",
    slug: tool.slug,
    href: `/learn/alat/${tool.slug}`,
    title: tool.name,
    excerpt: clampExcerpt(plainText(tool.intro_md)),
    // The standard is how a specifier searches for a calculator: they type
    // "AVIXA DISCAS" or "ISO 3382", not "kalkulator ukuran layar".
    tags: tool.standard_ref ? [tool.standard_ref] : [],
  };
}

export function roomDoc(room: RoomInput): SearchDoc {
  return {
    kind: "ruang",
    slug: room.slug,
    href: `/learn/ruang/${room.slug}`,
    title: room.title,
    excerpt: clampExcerpt(plainText(room.excerpt)),
    tags: cleanTags(room.tags),
  };
}

export function glossaryDoc(entry: GlossaryInput): SearchDoc {
  return {
    kind: "istilah",
    slug: entry.anchor,
    // One glossary page, one anchor per term (§11.0) — never a page per term.
    href: `/learn/glosarium#${entry.anchor}`,
    title: entry.term,
    excerpt: clampExcerpt(plainText(entry.definition)),
    tags: (entry.aliases ?? []).map((a) => a.trim()).filter(Boolean).slice(0, 6),
  };
}

/* ------------------------------------------------------------------ *
 * The payload
 * ------------------------------------------------------------------ */

/**
 * Build the whole payload. Grouped by kind in `SEARCH_KIND_ORDER` and
 * alphabetical within a group, so the serialized JSON is byte-stable across
 * builds and does not churn the static HTML on every deploy.
 *
 * Rows with an empty slug or title are dropped rather than rendered as an
 * unclickable ghost; duplicates by `kind:slug` collapse to the first.
 */
export function buildSearchCorpus(input: SearchCorpusInput): SearchDoc[] {
  const docs: SearchDoc[] = [
    ...(input.paths ?? []).map(pathDoc),
    ...(input.rooms ?? []).map(roomDoc),
    ...(input.lessons ?? []).map(lessonDoc),
    ...(input.tools ?? []).map(toolDoc),
    ...(input.glossary ?? []).map(glossaryDoc),
  ];

  const seen = new Set<string>();
  const kept: SearchDoc[] = [];
  for (const doc of docs) {
    if (!doc.slug || !doc.title.trim()) continue;
    const key = `${doc.kind}:${doc.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(doc);
  }

  const rank = new Map<SearchKind, number>(SEARCH_KIND_ORDER.map((k, i) => [k, i]));
  return kept.sort(
    (a, b) =>
      (rank.get(a.kind) ?? 0) - (rank.get(b.kind) ?? 0) ||
      a.title.localeCompare(b.title, "id"),
  );
}

/**
 * Serialized size of the payload in bytes. The hub ships this inline, so it is
 * a real byte cost against the ≤105 KB first-load budget (§14.6) — assert on it
 * in a test rather than discovering the regression in Lighthouse.
 */
export function corpusPayloadBytes(docs: readonly SearchDoc[]): number {
  return new TextEncoder().encode(JSON.stringify(docs)).length;
}

/** Ceiling the payload is expected to stay under until the 120-document promotion. */
export const CORPUS_BYTE_BUDGET = 48_000;
