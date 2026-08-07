"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LEARN_ROLES, isLearnRoleId, type LearnRoleId } from "@/lib/learn/roles";
import { cn } from "@/lib/utils";

/**
 * The role filter on /learn (03-UI §11.2, 02-DATA §6.3).
 *
 * Three binding constraints shape the whole implementation:
 *
 * 1. **The complete, unfiltered list stays in the server HTML.** The rows are
 *    passed in as `children` — server-rendered, never re-rendered here — and
 *    filtering is done by a CSS attribute selector on a wrapper. Googlebot and a
 *    reader with JavaScript disabled both get every lesson. Nothing indexable is
 *    gated, reordered or conditioned by client state.
 * 2. **`history.replaceState`, never `router.push`.** A push would add a Next
 *    navigation, a history entry per chip tap, and — on a `force-static` page —
 *    a round trip for an in-memory `Array.filter`. `replaceState` makes the
 *    filtered view shareable and the back button still leaves /learn.
 * 3. **Role is never a route.** `/learn/peran/*` is on the reserved-slug denylist
 *    precisely so this can never quietly become a faceted URL space.
 *
 * The active state starts `null` on both server and client, so the first client
 * render is byte-identical to the server HTML; the URL is read in an effect,
 * after hydration.
 *
 * Chips with zero matching lessons are not rendered at all. That removes the
 * empty-result state by construction, which matters because CSS-only filtering
 * cannot detect one.
 */

/**
 * Per-role hide rules. Static strings so Tailwind's scanner can see them.
 *
 * Reads as: inside this scope, hide every element that declares a `data-role`
 * whose space-separated list does NOT contain this role. `LessonRow` always
 * emits the attribute — empty string included — so a lesson carrying no role tag
 * is hidden by a filter rather than surviving all three. Elements with no
 * `data-role` at all are untouched, which is how section headings inside a list
 * stay visible.
 */
const HIDE_OTHERS: Record<LearnRoleId, string> = {
  "pengambil-keputusan":
    "[&_[data-role]:not([data-role~=pengambil-keputusan])]:hidden",
  "teknis-internal": "[&_[data-role]:not([data-role~=teknis-internal])]:hidden",
  "spesifier-pengadaan":
    "[&_[data-role]:not([data-role~=spesifier-pengadaan])]:hidden",
};

export type RoleChipsProps = {
  /**
   * Lessons per role, counted on the server. A role missing from this map, or
   * present with 0, gets no chip.
   */
  counts?: Partial<Record<LearnRoleId, number>>;
  /** Total lessons, shown on the "Semua" chip. Omit to hide the number. */
  total?: number;
  /** Label on the reset chip. */
  allLabel?: string;
  /** Query parameter written by `replaceState`. Frozen as `peran`. */
  paramName?: string;
  /** Accessible name of the chip group. */
  label?: string;
  /** The server-rendered list. Each filterable element carries `data-role`. */
  children: ReactNode;
  className?: string;
  /** Applied to the wrapper that owns the filter scope. */
  listClassName?: string;
};

export function RoleChips({
  counts,
  total,
  allLabel = "Semua",
  paramName = "peran",
  label = "Saring pelajaran menurut peran Anda",
  children,
  className,
  listClassName,
}: RoleChipsProps) {
  const [active, setActive] = useState<LearnRoleId | null>(null);

  const available = LEARN_ROLES.filter((role) => (counts?.[role.id] ?? 0) > 0);

  // Read the URL after hydration, never during render. Restores a shared link
  // like /learn?peran=spesifier-pengadaan without changing the first paint.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(paramName);
    if (!raw || !isLearnRoleId(raw)) return;
    setActive(raw);
  }, [paramName]);

  const select = useCallback(
    (next: LearnRoleId | null) => {
      setActive(next);
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(paramName, next);
      else url.searchParams.delete(paramName);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [paramName],
  );

  // A role can disappear from `counts` between deploys; fall back to unfiltered
  // rather than hiding everything.
  const resolved = active && available.some((role) => role.id === active) ? active : null;

  const chip = (isActive: boolean) =>
    cn(
      "mono-spec inline-flex min-h-11 items-center gap-2 rounded-pill px-4 transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      isActive
        ? "bg-primary/15 text-accent-text ring-1 ring-inset ring-primary/40"
        : "text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground hover:ring-foreground/40",
    );

  return (
    <div className={className}>
      {available.length > 0 ? (
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={resolved === null} onClick={() => select(null)} className={chip(resolved === null)}>
            {allLabel}
            {typeof total === "number" && total > 0 ? (
              <span className="tabular-nums text-muted-foreground/70">{total}</span>
            ) : null}
          </button>

          {available.map((role) => (
            <button
              key={role.id}
              type="button"
              aria-pressed={resolved === role.id}
              onClick={() => select(resolved === role.id ? null : role.id)}
              className={chip(resolved === role.id)}
            >
              {role.label}
              <span className="tabular-nums text-muted-foreground/70">
                {counts?.[role.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        data-active-role={resolved ?? undefined}
        className={cn(available.length > 0 && "mt-6", resolved ? HIDE_OTHERS[resolved] : null, listClassName)}
      >
        {children}
      </div>
    </div>
  );
}
