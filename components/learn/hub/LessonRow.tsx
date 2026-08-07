import Link from "next/link";
import { ReviewedStamp } from "@/components/learn/hub/ReviewedStamp";
import { LEARN_ROLES, type LearnRoleId } from "@/lib/learn/roles";
import { cn } from "@/lib/utils";

/**
 * One dense lesson row (03-UI §11.2).
 *
 * A 14–18 lesson corpus is a **list**, not a card grid: a grid of three cards per
 * row turns eighteen scannable titles into six screens of whitespace, and 13 §L5
 * caps uniform card grids at 40% of a page's sections anyway. The row is the
 * whole link target — no arrow that slides on hover (13 §C4), no chevron, no
 * "Baca selengkapnya".
 *
 * **Root element is `<li>`.** Callers wrap in `<ul>`/`<ol>`; the syllabus on a
 * jalur page passes `index` and gets a continuous numbering, the hub omits it.
 *
 * **`data-role` is the client filter's only contract.** `RoleChips` hides
 * non-matching rows with a CSS attribute selector rather than by re-rendering
 * the list, which is what keeps the complete, unfiltered list in the server HTML
 * for crawlers and for readers with JavaScript off.
 */

export type LessonRowProps = {
  /** Flat lesson URL — `/learn/{slug}`. Lessons are never nested under a path. */
  href: string;
  title: string;
  /** One line of context. Clamped to two lines; pass the excerpt as authored. */
  excerpt?: string | null;
  /** 1-based position inside a syllabus. Omit on the hub — the hub has no order. */
  index?: number | null;
  /**
   * Bare role ids from `articles.tags[]`. Emitted as a space-separated
   * `data-role` attribute and rendered as a plain (never amber) label: the
   * two-amber-elements-per-viewport budget cannot survive one chip per row.
   */
  roleIds?: readonly LearnRoleId[];
  /** `articles.reading_time`, in minutes. Rendered only when a real number. */
  readingTime?: number | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  /** Marks the row the reader is currently on, inside a syllabus. */
  current?: boolean;
  className?: string;
};

const ROLE_LABEL: Record<LearnRoleId, string> = LEARN_ROLES.reduce(
  (acc, role) => {
    acc[role.id] = role.label;
    return acc;
  },
  {} as Record<LearnRoleId, string>,
);

export function LessonRow({
  href,
  title,
  excerpt,
  index,
  roleIds,
  readingTime,
  reviewedAt,
  publishedAt,
  current = false,
  className,
}: LessonRowProps) {
  const roles = (roleIds ?? []).filter((id) => id in ROLE_LABEL);
  const minutes =
    typeof readingTime === "number" && Number.isFinite(readingTime) && readingTime > 0
      ? Math.round(readingTime)
      : null;

  return (
    <li
      // Always emitted, empty string included. `RoleChips` hides
      // `[data-role]:not([data-role~=x])`, so a lesson whose tags[] carries no
      // role must still declare the attribute or it would survive every filter —
      // publish validation asks for exactly one role tag but nothing in the
      // database enforces it, so untagged rows do occur.
      data-role={roles.join(" ")}
      className={cn("border-b border-border last:border-b-0", className)}
    >
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "group grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-4 py-4",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:grid-cols-[2.5rem_minmax(0,1fr)]",
        )}
      >
        {/* Mono index instead of an icon (13 §O1). A bare hairline tick when the
            row has no position — the column still holds, so titles stay aligned. */}
        <span
          aria-hidden
          className={cn(
            "mono-spec pt-0.5 tabular-nums",
            current ? "text-accent-text" : "text-muted-foreground/70",
          )}
        >
          {typeof index === "number" && index > 0 ? (
            String(index).padStart(2, "0")
          ) : (
            <span className="mt-2 block h-px w-3 bg-border" />
          )}
        </span>

        <span className="min-w-0">
          <span
            className={cn(
              "heading-md block text-pretty decoration-1 underline-offset-4",
              "group-hover:decoration-primary group-hover:underline",
              current && "text-accent-text",
            )}
          >
            {title}
          </span>

          {excerpt ? (
            <span className="body-sm mt-1.5 line-clamp-2 block text-muted-foreground">
              {excerpt}
            </span>
          ) : null}

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {roles.map((id) => (
              <span key={id} className="mono-spec text-muted-foreground">
                {ROLE_LABEL[id]}
              </span>
            ))}
            {minutes ? (
              <span className="mono-spec tabular-nums text-muted-foreground">
                {minutes} menit baca
              </span>
            ) : null}
            <ReviewedStamp reviewedAt={reviewedAt} publishedAt={publishedAt} />
          </span>
        </span>
      </Link>
    </li>
  );
}
