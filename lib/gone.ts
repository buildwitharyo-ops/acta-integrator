/**
 * URLs for content that was published, then permanently withdrawn — served as
 * **410 Gone** rather than 404.
 *
 * The distinction is not pedantry. A 404 means "not found", which Google treats as
 * possibly temporary and keeps re-crawling for months. A 410 means "this existed and
 * is never coming back", and it is dropped from the index materially faster. For a
 * catalog that withdraws stock, 410 is simply the true answer.
 *
 * It is also the honest alternative to the tempting fix: 301-ing a withdrawn product
 * to `/products`. That is the soft-404 redirect pattern — the hub does not answer the
 * query the ranking URL answered, so Google discards the redirect and the equity with
 * it, while a human who followed a link to a specific product lands somewhere that
 * silently is not it. Redirect only where a genuine one-to-one replacement exists.
 *
 * ── Why this list is hand-maintained ────────────────────────────────────────────
 * It cannot be derived from the database. An unpublished row is indistinguishable
 * from a draft that was never published and from a product being edited — and both of
 * those must keep returning 404, not 410. Only a person knows the difference between
 * "not ready" and "never again", so withdrawal is recorded explicitly here, the same
 * way legacy URL moves are recorded explicitly in the `redirects` table.
 *
 * ── Maintenance ─────────────────────────────────────────────────────────────────
 * Adding a path: the product must already be unpublished, or the page will keep
 * rendering and the 410 will contradict it.
 * Removing a path: required whenever a product is republished — otherwise the row is
 * live and the URL still reports Gone. The rollback block in
 * supabase/archive-control-system.sql names this as a paired step.
 */

/**
 * Exact pathnames, no trailing slash, no query string. Matching is exact and
 * case-insensitive; nothing here is a prefix or a pattern, so a path can never
 * take down a subtree by accident.
 */
export const GONE_PATHS: readonly string[] = [
  // Control System — withdrawn from the catalog 2026-08-07.
  // See supabase/archive-control-system.sql for the record and the rollback.
  "/products/c/control-system",
  "/products/cue-controlcue-three",
  "/products/audac-rivea-amk10-b",
  "/products/cue-relaycue-8",
];

const GONE_SET = new Set(GONE_PATHS.map((p) => p.toLowerCase()));

/** True when `pathname` names permanently withdrawn content. */
export function isGonePath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return GONE_SET.has(normalized.toLowerCase());
}
