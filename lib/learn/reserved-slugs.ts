// Frozen /learn URL namespace (02-DATA-SEO-AND-CMS.md §7.1 · §8.1).
//
// Lessons live flat at /learn/{slug}, so they share one namespace with every
// /learn/* sub-route. A lesson slugged "alat" silently shadows an entire route
// segment and produces a 404 nobody can diagnose.
//
// ┌─ MIRRORED ON PURPOSE ────────────────────────────────────────────────────┐
// │ This list is the exact twin of the SQL function                          │
// │ public.learn_slug_is_reserved(text) in                                   │
// │ supabase/migrations/20260722100000_learn_platform.sql.                   │
// │ Both layers are required: Zod gives the editor a readable Bahasa error,  │
// │ the DB CHECK is the backstop for every other write path (SQL console,    │
// │ service-role script, a future importer). CHANGE THEM TOGETHER — a value  │
// │ added here but not there is not enforced, and a value added there but    │
// │ not here surfaces as an opaque Postgres constraint violation.            │
// └──────────────────────────────────────────────────────────────────────────┘
export const RESERVED_LEARN_SLUGS: readonly string[] = [
  // live segments
  "jalur",
  "alat",
  "ruang",
  "glosarium",
  // rejected synonyms, reserved so a future rename stays possible
  "kamus",
  "istilah",
  "kalkulator",
  "kelas",
  "kursus",
  "modul",
  "topik",
  "peran",
  "penulis",
  "tim",
  "unduh",
  "semua",
  "ringkasan",
  // infrastructure
  "cari",
  "search",
  "sitemap",
  "feed",
  "rss",
  "api",
  "index",
  "page",
  "halaman",
];

// Mirrors `lower(s) = any (array[...])`. The extra trim is a superset of the SQL
// behaviour: slugs never legitimately carry surrounding whitespace, and rejecting
// " alat " here keeps the Zod message honest instead of deferring to the CHECK.
export function isReservedLearnSlug(s: string): boolean {
  return RESERVED_LEARN_SLUGS.includes(s.trim().toLowerCase());
}
