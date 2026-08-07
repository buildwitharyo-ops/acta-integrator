"use client";

import { useEffect, useMemo, useState } from "react";
import type { Heading } from "@/lib/article";
import { cn } from "@/lib/utils";

/** Below this, a TOC is noise: the reader can see the whole lesson by scrolling once. */
export const LESSON_TOC_MIN_HEADINGS = 3;

export type LessonTocProps = {
  /** Pass H2s only. H3s make a lesson TOC read as an index rather than a map. */
  headings: readonly Heading[];
  /**
   * `rail` — an always-open list for the sticky side column. The **caller** owns
   * the breakpoint at which the column exists; the component does not restate it.
   * `inline` — a collapsed `<details>` for the content flow, where a 9-item open
   * list would push the lesson body off a phone screen.
   *
   * Rendering both presentations inside one component would put the whole TOC in
   * the HTML twice on every lesson, with one copy permanently `display:none`.
   */
  variant?: "rail" | "inline";
  /** Mono eyebrow. Default "DAFTAR ISI". */
  label?: string;
  /** Anchor target for the skip link — on `inline` it is also the `<details>` id. */
  id?: string;
  className?: string;
};

const TOP_LABEL = "Ke atas ↑";

/**
 * The lesson table of contents (01 §4.5, 03-UI §11.1) — the existing `ArticleToc`
 * amber scroll-spy, extended for the lesson shell.
 *
 * Left rail answers *where am I in the curriculum*; this answers **where am I in
 * this document**. Four things differ from `ArticleToc`:
 *
 *  1. **H2 only.** A lesson's H2s are its argument; adding H3s turns a 6-item map
 *     into a 20-item index that nobody reads on a phone.
 *  2. **A 1px read-through hairline** whose portion above the active heading sits
 *     at `bg-primary/40`. It reuses the meter language to show position **without
 *     ever printing a percentage** — a number here would be a completion metric,
 *     and this platform ships none (01 §5.5).
 *  3. **`Ke atas ↑`** closes the rail, because the H1 is the one destination the
 *     scroll-spy can never mark.
 *  4. **`useReducedMotion` is implemented natively**, not imported. `motion/react`
 *     is ~38 KB and is on the hard import blacklist for `/learn/**` (§14.6); a
 *     `matchMedia` listener is four lines and does the same job. Under
 *     `prefers-reduced-motion: reduce` the jump is instant — smooth scrolling is
 *     a vestibular trigger, not a flourish.
 *
 * `IntersectionObserver` with `rootMargin: "-20% 0px -70% 0px"` is kept verbatim
 * from `ArticleToc`: it marks the heading in the upper-middle band of the
 * viewport, which is where a reader's eye actually is.
 *
 * The lesson template mounts this **twice**, `variant="rail"` in the ≥1280px side
 * column and `variant="inline"` in the content flow below it, under mutually
 * exclusive media queries — the only arrangement that puts the mobile TOC *after*
 * the H1 and the answer rather than above them. Exactly one is ever in the
 * accessibility tree. Each variant therefore renders one presentation and never
 * restates the other's breakpoint, so the TOC markup is in the HTML once per
 * viewport, not twice.
 */
export function LessonToc({
  headings,
  variant = "rail",
  label = "DAFTAR ISI",
  id,
  className,
}: LessonTocProps) {
  const ids = useMemo(() => headings.map((h) => h.id), [headings]);
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduce(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (ids.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const headingId of ids) {
      const el = document.getElementById(headingId);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  if (headings.length < LESSON_TOC_MIN_HEADINGS) return null;

  const activeIndex = active ? ids.indexOf(active) : -1;
  // Position, expressed as a rule length. Never rendered as a number.
  const readThrough = activeIndex >= 0 ? ((activeIndex + 1) / ids.length) * 100 : 0;

  const jump = (event: React.MouseEvent, targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(targetId);
    history.replaceState(null, "", `#${targetId}`);
  };

  const toTop = (event: React.MouseEvent) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", window.location.pathname);
  };

  const list = (
    <div className="relative pl-4">
      <span aria-hidden className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-border" />
      <span
        aria-hidden
        className="absolute left-0 top-1 w-px bg-primary/40 transition-[height] duration-300 motion-reduce:transition-none"
        style={{ height: `calc((100% - 0.5rem) * ${readThrough / 100})` }}
      />
      <ul className="space-y-2.5">
        {headings.map((heading) => {
          const isActive = active === heading.id;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(event) => jump(event, heading.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-sm py-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 shrink-0 rounded-full transition-all duration-300 motion-reduce:transition-none",
                    isActive ? "w-5 bg-primary" : "w-2.5 bg-border group-hover:bg-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "body-sm transition-colors motion-reduce:transition-none",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {heading.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href="#"
        onClick={toTop}
        className={cn(
          "caption mt-4 inline-flex items-center text-muted-foreground transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {TOP_LABEL}
      </a>
    </div>
  );

  if (variant === "rail") {
    // The side column already only exists at the breakpoint the caller chose, so
    // the list is simply open. No inner media query, no second copy.
    return (
      <nav id={id} aria-label="Daftar isi" className={cn("print:hidden", className)}>
        <p className="mono-label mb-4 text-muted-foreground">{label}</p>
        {list}
      </nav>
    );
  }

  // In flow, under the answer: a native <details>. Zero JS to open, it prints
  // expanded, and it costs one row of vertical space instead of nine.
  return (
    <nav aria-label="Daftar isi" className={cn("print:hidden", className)}>
      <details id={id} className="rounded-lg border border-border px-4 py-3">
        <summary
          className={cn(
            "mono-label flex min-h-11 cursor-pointer list-none items-center text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          {label}
        </summary>
        <div className="mt-4">{list}</div>
      </details>
    </nav>
  );
}
