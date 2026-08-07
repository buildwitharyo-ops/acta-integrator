"use client";

/**
 * Recently Viewed (03 §11.4) — the second and last piece of persisted state.
 *
 * It is a LEAF, never a wrapper, and it renders `null` until the store has
 * hydrated. It never gates, reorders or conditions indexable text: Googlebot is
 * always an empty-storage first visit, so what gets indexed is the page WITHOUT
 * this block, and that has to be a complete page.
 *
 * This is NOT "Lanjutkan Belajar". There is no progress, no `3/8`, no percent,
 * no resume position and no next-lesson suggestion — a "continue" module renders
 * its empty state most often for readers arriving from a WhatsApp forward, whose
 * in-app webview has a separate storage partition, which teaches exactly the
 * highest-value readers that the site is broken.
 *
 * ── WHY IT TAKES A CATALOGUE ───────────────────────────────────────────────
 * The store holds `articles.id` UUIDs and nothing else, because a slug-keyed
 * store orphans on the first rename. So titles and hrefs must come from the
 * server-rendered payload: pass every candidate in `items`, and this component
 * orders and filters them by what is actually in storage. An id with no matching
 * item is silently dropped — that is an unpublished or deleted lesson, and a
 * dead row is worse than a missing one.
 */

import Link from "next/link";
import { useMemo } from "react";

import { useSaved } from "@/lib/learn/save/useSaved";
import { cn } from "@/lib/utils";

export type RecentlyViewedItem = {
  /** `articles.id` — must match what the lesson page recorded. */
  id: string;
  title: string;
  /** Site-relative, e.g. `/learn/rt60-kenapa-ruangan-bergema`. */
  href: string;
  /** Optional one-line context: "8 menit · Akustik". */
  meta?: string;
};

export type RecentlyViewedProps = {
  /** Every lesson that could appear. Order here is irrelevant. */
  items: readonly RecentlyViewedItem[];
  /** The article currently on screen — it is not "recently viewed", it is open. */
  excludeId?: string | null;
  /** Rows rendered. The store itself caps history at 8. */
  limit?: number;
  heading?: string;
  className?: string;
};

export function RecentlyViewed({
  items,
  excludeId,
  limit = 5,
  heading = "Terakhir dibuka",
  className,
}: RecentlyViewedProps) {
  const { ready, seen } = useSaved();

  const byId = useMemo(
    () => new Map<string, RecentlyViewedItem>(items.map((item) => [item.id, item])),
    [items],
  );

  const rows = useMemo(() => {
    const out: RecentlyViewedItem[] = [];
    for (const entry of seen) {
      if (entry.id === excludeId) continue;
      const item = byId.get(entry.id);
      if (!item) continue;
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  }, [seen, byId, excludeId, limit]);

  // No empty state, ever. An empty "Terakhir dibuka" box is a promise the
  // storage partition cannot keep; absence costs the reader nothing.
  if (!ready || rows.length === 0) return null;

  return (
    <nav aria-label={heading} className={cn("border-t border-border", className)}>
      {/* A <p>, not an <h2> (§11.1): this is chrome beside the document, and a
          heading here would pollute the lesson's outline and its TOC. */}
      <p className="mono-label pt-5 text-muted-foreground">{heading}</p>
      <ul className="mt-2">
        {rows.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex min-h-11 flex-col justify-center gap-0.5 border-b border-border/60 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-sm font-medium text-foreground transition-colors group-hover:text-accent-text">
                {item.title}
              </span>
              {item.meta ? (
                <span className="mono-spec text-xs text-muted-foreground">{item.meta}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default RecentlyViewed;
