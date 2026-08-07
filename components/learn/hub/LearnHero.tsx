import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The /learn opener (03-UI §11.2).
 *
 * Deliberately **not** the `ArticleHub` template (eyebrow → headline → lede →
 * divider → featured card → chip row → three-column grid). That template is
 * correct for a news feed and wrong for a reference work: it leads with the
 * newest thing, and on /learn the newest thing is never what the reader came
 * for. 13 §L1 also caps the standard opener at half a page's sections and §L5
 * caps card grids at 40% — spending both budgets in the first viewport leaves
 * nothing for the rest of the page.
 *
 * Instead the headline column is **anchored to a spec panel on the same row**
 * (13 §L7): a labelled definition list of what actually exists — lessons, jalur,
 * calculators, last review month. It is the engineering-drawing register the
 * whole site is built in, it is four facts rather than four giant numbers
 * (13 §O4 bans the stat strip), and it sets the asymmetric grid the sections
 * below reuse.
 *
 * Exactly one texture layer, switched by theme (13 §T5): warm-paper grain in
 * Studio Daylight, a 1px technical grid in Control Room. Never both, never a
 * flat token fill.
 *
 * Nothing here is wrapped in `Reveal` — this is above the fold, and 13 §M3
 * requires first-paint visibility.
 */

export type LearnHeroSpec = {
  /** Lowercase, e.g. "pelajaran". Kept out of all-caps to protect the T6 budget. */
  label: string;
  /** Short value, e.g. "18" or "JUL 2026". */
  value: string;
};

export type LearnHeroProps = {
  /** The single all-caps mono string in this viewport. */
  eyebrow?: string;
  headline: string;
  lede: string;
  /** The anchoring spec panel. Rendered only when at least one row is passed. */
  specs?: readonly LearnHeroSpec[];
  /** Footnote under the spec panel, e.g. the source discipline line. */
  specNote?: string;
  /** Search trigger and any primary links, rendered under the lede. */
  children?: ReactNode;
  className?: string;
};

export function LearnHero({
  eyebrow,
  headline,
  lede,
  specs,
  specNote,
  children,
  className,
}: LearnHeroProps) {
  const rows = specs ?? [];

  return (
    <section
      className={cn("relative isolate overflow-hidden border-b border-border", className)}
    >
      <div aria-hidden className="texture-paper absolute inset-0 dark:hidden" />
      <div aria-hidden className="texture-grid absolute inset-0 hidden opacity-60 dark:block" />

      <div className="container relative py-expansive">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
          <div className="max-w-[22ch] lg:max-w-none">
            {eyebrow ? (
              <p className="mono-label text-muted-foreground">{eyebrow}</p>
            ) : null}

            <h1 className="display-xl mt-5 max-w-[16ch] text-balance">{headline}</h1>

            <p className="body-lg mt-6 max-w-[46ch] text-muted-foreground">{lede}</p>

            {children ? <div className="mt-8 max-w-[34rem]">{children}</div> : null}
          </div>

          {rows.length > 0 ? (
            <div className="lg:border-l lg:border-border lg:pl-10">
              <dl className="grid grid-cols-2 gap-x-8 sm:grid-cols-4 lg:grid-cols-1 lg:gap-x-0">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0 lg:py-3.5"
                  >
                    <dt className="mono-spec text-muted-foreground">{row.label}</dt>
                    <dd className="mono-spec tabular-nums text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {specNote ? (
                <p className="caption mt-4 max-w-[32ch] text-muted-foreground">{specNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
