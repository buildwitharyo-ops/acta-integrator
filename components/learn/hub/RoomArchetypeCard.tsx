import Link from "next/link";
import { formatReviewMonth } from "@/components/learn/hub/ReviewedStamp";
import { CornerTicks } from "@/components/shared/CornerTicks";
import type { RoomSummary } from "@/lib/learn/rooms";
import { cn } from "@/lib/utils";

/**
 * One room archetype, as a card (03-UI §11.2, 04-ROADMAP §17.3).
 *
 * The card leads with **computed readouts**, not with a photograph and a
 * promise. Every value in `summary.stats` was produced by the same audited
 * `compute()` the public calculators run — so the card, the archetype page and
 * the calculator are three renderings of one arithmetic, and cannot disagree.
 * That is the only thing this section has that a competitor cannot reproduce
 * over a weekend, so it is what the card puts first.
 *
 * Server component, no client JavaScript, no motion. `CornerTicks` supplies the
 * angular technical detail every raised surface owes (13 §C6/§O9); there is no
 * decorative icon, no glow, and no hover-translate arrow (13 §C1/§C2/§C4).
 *
 * Sized to be usable from the /learn hub as well as `/learn/ruang`, which is why
 * it takes a plain `RoomSummary` and never touches the archetype constant or any
 * query. `headingLevel` exists because the hub renders these under an `<h2>` and
 * the index page renders them as the section's own `<h2>`.
 */

export type RoomArchetypeCardProps = {
  summary: RoomSummary;
  /** 1-based position, printed as a mono index in place of an icon (13 §O1). */
  index?: number;
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function RoomArchetypeCard({
  summary,
  index,
  headingLevel = "h3",
  className,
}: RoomArchetypeCardProps) {
  const Heading = headingLevel;
  const reviewed = formatReviewMonth(summary.reviewedAt);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-border bg-card",
        "transition-colors focus-within:border-primary/60 hover:border-primary/60",
        className,
      )}
    >
      <CornerTicks size={9} />

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <p className="mono-label text-muted-foreground">{summary.eyebrow}</p>
          {typeof index === "number" && index > 0 ? (
            <span aria-hidden className="mono-spec tabular-nums text-muted-foreground/60">
              {String(index).padStart(2, "0")}
            </span>
          ) : null}
        </div>

        <Heading className="display-md mt-4 text-pretty">
          <Link
            href={summary.href}
            className={cn(
              "decoration-1 underline-offset-4 outline-none",
              "group-hover:underline group-hover:decoration-primary",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
              "focus-visible:ring-offset-card",
              // Whole-card target without nesting interactive elements.
              "after:absolute after:inset-0 after:content-['']",
            )}
          >
            {summary.title}
          </Link>
        </Heading>

        <p className="body-sm mt-3 max-w-[46ch] text-muted-foreground">{summary.promise}</p>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
          {summary.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="caption text-muted-foreground">{stat.label}</dt>
              <dd className="mono-spec mt-1 text-foreground">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-6">
          <span className="mono-spec text-muted-foreground">{summary.capacity}</span>
          {reviewed ? (
            <time dateTime={summary.reviewedAt} className="mono-spec text-muted-foreground">
              Ditinjau {reviewed}
            </time>
          ) : null}
        </div>
      </div>
    </article>
  );
}
