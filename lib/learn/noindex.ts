import type { Metadata } from "next";

// The /learn launch gate (04 §17.0 P0-4).
//
// /learn is live, indexed, and empty today. An indexed empty section is not a neutral placeholder —
// it is a standing quality signal attached to the whole host: crawl budget spent on a hub that
// resolves to nothing, and a thin page competing for the site's own brand queries. The fix is not to
// hide /learn from humans; it is to withhold it from the index until it earns a place there.
//
// The gate is DATA-DRIVEN and SELF-RESOLVING. It reads the count of published lessons at render
// time, so the moment the 8th lesson publishes and the `learn` tag revalidates, /learn and every
// /learn/* page begin emitting `index`. There is no launch-day checklist item, no feature flag to
// flip, no environment variable to set, and no deploy required — the condition that made noindex
// correct is the same condition that removes it. Equally, if lessons were ever unpublished back
// below the threshold, the gate closes again on its own.
//
// `follow` is true in BOTH states, always and deliberately. noindex/nofollow would strand the
// internal links out of /learn to products and solutions; noindex/follow keeps the section fully
// crawlable — links are discovered and their signal flows — while keeping the pages themselves out
// of results until the section is worth showing.
//
// Usage from a /learn route (Server Component / generateMetadata):
//   robots: learnRobotsMeta(await getPublishedLessonCount())
// spread into the object returned by buildMetadata().

// Below this many published lessons, /learn and /learn/* are noindex. Eight is the point at which
// the hub stops being a stub and starts being a section: enough lessons to carry internal linking,
// a path, and topical coverage a crawler can read as intent rather than as an accident.
export const LEARN_LAUNCH_MIN_LESSONS = 8;

/**
 * Robots directives for /learn and /learn/* given the number of PUBLISHED lessons.
 *
 * Returns `{ index: false, follow: true }` below `LEARN_LAUNCH_MIN_LESSONS`, `{ index: true,
 * follow: true }` at or above it. Non-finite or negative inputs (a failed count, never a real one)
 * resolve to the closed gate — the safe direction, since an accidental noindex costs a few days of
 * indexing while an accidental index of an empty section costs a host-level quality signal.
 */
export function learnRobotsMeta(publishedLessonCount: number): Metadata["robots"] {
  const launched =
    Number.isFinite(publishedLessonCount) && publishedLessonCount >= LEARN_LAUNCH_MIN_LESSONS;
  return { index: launched, follow: true };
}
