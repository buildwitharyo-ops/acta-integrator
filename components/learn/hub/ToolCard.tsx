import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * One calculator, as a row (03-UI §11.2 / §12).
 *
 * Row-shaped rather than card-shaped on purpose: three tools in a three-up grid
 * is the exact "uniform card grid" shape 13 §L5 caps, and the thing that sells a
 * calculator is the *standard it implements* — a line of text — not a tile.
 *
 * The standard reference is the whole differentiator: no Indonesian competitor
 * names ANSI/AVIXA V202.01 or ISO 3382-1 next to its calculator, and the reader
 * who cares about that line is the specifier worth the most.
 */

export type ToolCardProps = {
  /** `/learn/alat/{slug}`. */
  href: string;
  name: string;
  /** Plain text, already stripped of Markdown. One or two lines. */
  summary?: string | null;
  /** `learn_tools.standard_ref`, e.g. "ANSI/AVIXA V202.01:2016". */
  standardRef?: string | null;
  /** 1-based position, printed as a mono index in place of an icon (13 §O1). */
  index?: number | null;
  className?: string;
};

export function ToolCard({
  href,
  name,
  summary,
  standardRef,
  index,
  className,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-4 border-b border-border py-5",
        "transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span aria-hidden className="mono-spec pt-1 tabular-nums text-muted-foreground/70">
        {typeof index === "number" && index > 0 ? String(index).padStart(2, "0") : "—"}
      </span>

      <span className="min-w-0">
        <span
          className={cn(
            "heading-md block text-pretty decoration-1 underline-offset-4",
            "group-hover:decoration-primary group-hover:underline",
          )}
        >
          {name}
        </span>

        {summary ? (
          <span className="body-sm mt-1.5 line-clamp-2 block text-muted-foreground">
            {summary}
          </span>
        ) : null}

        {standardRef ? (
          <span className="mono-spec mt-2 block text-muted-foreground">{standardRef}</span>
        ) : null}
      </span>
    </Link>
  );
}
