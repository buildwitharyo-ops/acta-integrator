/**
 * One row in the command palette (03 §11.5).
 *
 * Purely presentational — no cmdk import, no hooks, no state. It renders in
 * whichever environment imports it, which keeps it usable if a server-rendered
 * results page is ever added and makes it trivially testable on its own.
 *
 * `<mark>` is styled `bg-primary/20` in light and `bg-primary/30` in dark —
 * NEVER `bg-yellow-200`, which is off-palette in light and unreadable in dark.
 * The dark value is higher on purpose: a translucent wash needs more opacity to
 * read as a region against a dark surface, not less.
 *
 * The marks earn their keep beyond decoration. `query.ts` marks stem matches and
 * matched synonyms too, so a reader who typed `videotron` sees **LED Display**
 * highlighted and instantly understands why a row they did not ask for is the
 * right answer. That is the three-register bridge explaining itself, with no UI
 * copy at all.
 */

import { SEARCH_KIND_BADGE } from "@/lib/learn/search/corpus";
import type { HighlightSegment, SearchResult } from "@/lib/learn/search/query";
import { cn } from "@/lib/utils";

function Highlighted({ segments, fallback }: { segments: readonly HighlightSegment[]; fallback: string }) {
  if (segments.length === 0) return <>{fallback}</>;
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            // Index keys are correct here: segments are a positional split of one
            // immutable string, so there is no identity to preserve.
            key={index}
            className="rounded-[2px] bg-primary/20 px-[0.1em] text-inherit dark:bg-primary/30"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

export type SearchResultRowProps = {
  result: SearchResult;
  /** Overrides the kind badge. Used by the zero state's "mirip" rows. */
  badge?: string;
  className?: string;
};

export function SearchResultRow({ result, badge, className }: SearchResultRowProps) {
  const { doc } = result;
  return (
    <span className={cn("flex w-full min-w-0 items-start gap-3", className)}>
      {/* Not aria-hidden: the badge is the option's kind, and cmdk builds each
          option's accessible name from its content. "PELAJARAN — RT60: …" is a
          better announcement than the bare title. */}
      <span className="mono-label mt-[0.15rem] shrink-0 rounded-sm border border-border px-1.5 py-1 text-[0.625rem] leading-none text-muted-foreground">
        {badge ?? SEARCH_KIND_BADGE[doc.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          <Highlighted segments={result.titleSegments} fallback={doc.title} />
        </span>
        {doc.excerpt ? (
          <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
            <Highlighted segments={result.excerptSegments} fallback={doc.excerpt} />
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default SearchResultRow;
