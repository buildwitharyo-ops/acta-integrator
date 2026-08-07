import Link from "next/link";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { ReviewedStamp } from "@/components/learn/hub/ReviewedStamp";
import { cn } from "@/lib/utils";

/**
 * A JALUR summary card (03-UI §11.2).
 *
 * **No meter, no `0/8`, no percentage, no ring.** `8 pelajaran` is a fact about
 * what exists; `4/12` is a promise about what does not, and an unkept promise on
 * a site positioned on competence is a liability, not a motivator. `lessonCount`
 * must therefore be derived from the resolved syllabus — `getLearnPathLessons()`
 * joins published-on-both-sides, so an unwritten lesson is *unrepresentable*
 * here rather than shown greyed out.
 *
 * The whole card is the link (13 §O3): no arrow that slides on hover, no
 * "Selengkapnya" affordance duplicating a target that is already 100% of the
 * card's area. Elevation is the raised token — hairline ring, corner ticks, a
 * 0.5px lift at 150 ms — never a glow (13 §C2).
 */

export type PathCardProps = {
  /** `/learn/jalur/{slug}`. */
  href: string;
  title: string;
  /** `learn_paths.eyebrow`, e.g. "JALUR 01". The card's one all-caps mono string. */
  eyebrow?: string | null;
  /** `learn_paths.promise` — the outcome, not a description. */
  promise: string;
  /** Resolved, published lessons only. See the note above. */
  lessonCount: number;
  /** Sum of `reading_time` over the resolved lessons, in minutes. */
  totalMinutes?: number | null;
  /** Human label for `learn_paths.role`, e.g. "Spesifier & Pengadaan". */
  roleLabel?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  /** Elevation context. "muted" sits on `bg-muted`, "card" on the page background. */
  tone?: "card" | "muted";
  className?: string;
};

export function PathCard({
  href,
  title,
  eyebrow,
  promise,
  lessonCount,
  totalMinutes,
  roleLabel,
  reviewedAt,
  publishedAt,
  tone = "card",
  className,
}: PathCardProps) {
  const minutes =
    typeof totalMinutes === "number" && Number.isFinite(totalMinutes) && totalMinutes > 0
      ? Math.round(totalMinutes)
      : null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-[22px] p-6 ring-1 ring-border transition-transform duration-150",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-8",
        tone === "muted" ? "bg-background" : "bg-card",
        className,
      )}
    >
      <CornerTicks className="rounded-[22px]" size={12} />

      {eyebrow ? (
        <span className="mono-label text-muted-foreground">{eyebrow}</span>
      ) : null}

      <span
        className={cn(
          "display-md mt-3 text-pretty decoration-1 underline-offset-[6px]",
          "group-hover:decoration-primary group-hover:underline",
        )}
      >
        {title}
      </span>

      <span className="body-md mt-3 text-pretty text-muted-foreground">{promise}</span>

      {/* Facts only. A dot-separated spec line, not a stat strip (13 §O4). */}
      <span className="mono-spec mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-6 text-muted-foreground">
        <span className="tabular-nums text-foreground">
          {lessonCount} pelajaran
        </span>
        {minutes ? (
          <>
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <span className="tabular-nums">±{minutes} menit baca</span>
          </>
        ) : null}
        {roleLabel ? (
          <>
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <span>{roleLabel}</span>
          </>
        ) : null}
      </span>

      <span className="mt-2 block">
        <ReviewedStamp reviewedAt={reviewedAt} publishedAt={publishedAt} />
      </span>
    </Link>
  );
}
