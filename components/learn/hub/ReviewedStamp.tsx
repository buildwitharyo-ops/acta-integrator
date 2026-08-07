import { cn } from "@/lib/utils";

/**
 * `Ditinjau JUL 2026` (03-UI §11.2, 02-DATA §9.5).
 *
 * Reads `articles.reviewed_at` — the column that exists precisely so a 15-minute
 * re-read becomes a visible act of maintenance. It renders **instead of**
 * `published_at`, never alongside it: two dates on one row invites the reader to
 * work out which one is stale, and a publish date on a reference work ages badly
 * in a way a review date does not. `published_at` is the fallback only, and it is
 * labelled honestly ("Terbit") so the stamp never claims a review that never
 * happened.
 *
 * NOT `updated_at`. A typo fix must not claim a review (§9.5's three-tier table).
 */

/** Bahasa Indonesia month abbreviations, three letters, as printed. */
const MONTH_ID = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
] as const;

/** WIB is UTC+7 and has no DST — a fixed offset is exact, not an approximation. */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * `"2026-07-04T22:10:00Z"` → `"JUL 2026"`, in Asia/Jakarta.
 *
 * Deliberately not `Intl.DateTimeFormat`: this string is baked into static HTML
 * on the server and must be byte-identical if it is ever re-derived on the
 * client, and ICU data availability is not something a mid-range Android browser
 * guarantees to match Node. Arithmetic on a fixed offset is deterministic
 * everywhere.
 */
export function formatReviewMonth(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return null;
  const local = new Date(time + WIB_OFFSET_MS);
  const month = MONTH_ID[local.getUTCMonth()];
  if (!month) return null;
  return `${month} ${local.getUTCFullYear()}`;
}

export type ReviewedStampProps = {
  /** `articles.reviewed_at`. The value this component exists for. */
  reviewedAt?: string | null;
  /** Fallback only, used when `reviewedAt` is null. Labelled "Terbit", not "Ditinjau". */
  publishedAt?: string | null;
  /** Override the review word. Default "Ditinjau". */
  reviewedLabel?: string;
  /** Override the fallback word. Default "Terbit". */
  publishedLabel?: string;
  className?: string;
};

/**
 * Renders `null` when neither date exists — a freshness signal with no date
 * behind it is worse than no signal.
 *
 * Typography note: this uses `mono-spec`, not `mono-label`. `mono-label` applies
 * `text-transform: uppercase`, which would print `DITINJAU JUL 2026` and spend a
 * slot from the two-all-caps-mono-strings-per-viewport budget (13 §T6) on every
 * row of a list. `mono-spec` prints the mixed-case string the spec actually
 * quotes, with `tabular-nums` so a column of dates lines up.
 */
export function ReviewedStamp({
  reviewedAt,
  publishedAt,
  reviewedLabel = "Ditinjau",
  publishedLabel = "Terbit",
  className,
}: ReviewedStampProps) {
  const reviewed = formatReviewMonth(reviewedAt);
  const iso = reviewed ? reviewedAt : publishedAt;
  const value = reviewed ?? formatReviewMonth(publishedAt);
  if (!value || !iso) return null;

  return (
    <time
      dateTime={iso}
      className={cn("mono-spec text-muted-foreground", className)}
    >
      {reviewed ? reviewedLabel : publishedLabel} {value}
    </time>
  );
}
