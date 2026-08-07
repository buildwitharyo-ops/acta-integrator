import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { cn } from "@/lib/utils";

export type LessonNavStep = {
  href: string;
  title: string;
  /** 1-based position in the syllabus. Rendered as a mono index. */
  index?: number | null;
  /** `section_label` of the step, when it differs from the current one. */
  section?: string | null;
};

export type LessonNavRelated = {
  href: string;
  title: string;
  /** One line. The lesson's excerpt, clamped by the caller. */
  excerpt?: string | null;
};

export type LessonNavProps = {
  /** Previous step in the PRIMARY path. Omit at the first step. */
  previous?: LessonNavStep | null;
  /** Next step in the PRIMARY path. Omit at the last step. */
  next?: LessonNavStep | null;
  /** The pillar page, shown between the two controls. */
  path?: { title: string; slug: string } | null;
  /**
   * Orphan mode. Rendered only when there is no `previous` and no `next` — a
   * lesson that belongs to no path is normal (a path must not go live below five
   * lessons), and the URL space is flat, so it costs nothing.
   */
  related?: readonly LessonNavRelated[];
  id?: string;
  className?: string;
};

function StepCard({ step, direction }: { step: LessonNavStep; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={step.href}
      rel={isNext ? "next" : "prev"}
      className={cn(
        "group flex min-h-11 flex-col justify-between gap-3 rounded-lg border border-border bg-card p-5",
        "transition-colors hover:border-foreground/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isNext && "sm:text-right",
      )}
    >
      <span className="mono-label text-muted-foreground">
        {isNext ? "Berikutnya ›" : "‹ Sebelumnya"}
      </span>
      <span className="heading-md text-balance text-foreground transition-colors group-hover:text-accent-text">
        {step.title}
      </span>
      {typeof step.index === "number" || step.section ? (
        <span className="mono-spec text-muted-foreground">
          {[typeof step.index === "number" ? `Pelajaran ${String(step.index).padStart(2, "0")}` : null, step.section]
            .filter(Boolean)
            .join(" · ")}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * End-of-lesson navigation (03-UI §11.1).
 *
 * **It shows titles, not arrows.** A bare `‹ ›` pair asks the reader to
 * remember what comes next; a title lets them decide whether to keep going,
 * which is the actual decision at the bottom of a lesson. Distinct from
 * `Pagination`, which pages a list.
 *
 * **Nothing dead is ever rendered.** No greyed-out "Sebelumnya" at the first
 * step, no disabled control at the last, no "coming soon" placeholder for an
 * unwritten lesson — `getLearnPathLessons()` joins published-on-both-sides, so
 * an unpublished lesson is *unrepresentable* rather than shown as a gap. At the
 * ends of a path the grid simply holds one card.
 *
 * **Orphan mode is not a degraded mode.** A lesson with no primary path renders
 * curated related reading instead — same weight, same treatment. Because the
 * `/learn/{slug}` URL space is flat and permanent, a lesson never needs a path to
 * be complete, and a path that has not reached five published lessons must stay
 * unpublished rather than ship a thin syllabus.
 *
 * No `group-hover:translate-x` on the arrows: the page's single permitted
 * arrow-slide is already spent by `FeaturedArticle` (13 C4).
 */
export function LessonNav({ previous, next, path, related, id, className }: LessonNavProps) {
  const hasSteps = Boolean(previous || next);
  const relatedList = (related ?? []).filter((item) => item.href && item.title);

  if (!hasSteps && relatedList.length === 0) return null;

  return (
    <nav
      id={id}
      aria-label={hasSteps ? "Navigasi jalur" : "Bacaan terkait"}
      className={cn("mt-14 print:hidden", className)}
    >
      <MeterDivider annotation={hasSteps ? "Jalur" : "Bacaan terkait"} />

      {hasSteps ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {previous ? <StepCard step={previous} direction="prev" /> : <span className="hidden sm:block" />}
            {next ? <StepCard step={next} direction="next" /> : null}
          </div>
          {path ? (
            <p className="mt-6">
              <Link
                href={`/learn/jalur/${path.slug}`}
                className={cn(
                  "mono-label inline-flex min-h-11 items-center text-accent-text transition-colors",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Lihat seluruh jalur: {path.title} →
              </Link>
            </p>
          ) : null}
        </>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {relatedList.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex min-h-11 flex-col gap-2 rounded-lg border border-border bg-card p-5",
                  "transition-colors hover:border-foreground/25",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="heading-md text-balance text-foreground transition-colors group-hover:text-accent-text">
                  {item.title}
                </span>
                {item.excerpt ? (
                  <span className="body-sm text-muted-foreground">{item.excerpt}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
