import type { ReactNode } from "react";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { cn } from "@/lib/utils";

export type AnswerBlockProps = {
  /** Mono eyebrow. Default "JAWABAN SINGKAT" (01 §5.2 item 4). */
  label?: string;
  /**
   * The answer itself: 40–60 words, self-contained, no anaphora. Pass rendered
   * prose (the walker hands over the node's paragraphs) or a plain string.
   */
  children?: ReactNode;
  /** Plain-text twin. Rendered when `children` is empty — degradation is a sentence. */
  fallback?: string;
  /** Named standard, e.g. "ANSI/AVIXA V202.01:2016 (DISCAS)". Printed as a chip. */
  standard?: string | null;
  id?: string;
  className?: string;
};

/**
 * JAWABAN SINGKAT — the searcher's entire visit (01 §5.2, §5.4).
 *
 * ~70–80% of traffic arrives from Google on one lesson, mid-corpus, holding a
 * question. This block answers that question in the first screen, before any
 * teaching prose, which is why the lesson template hoists it above the cover
 * image rather than leaving it wherever the body happens to start.
 *
 * Two deliberate structural choices:
 *
 *   1. **The label is a `<p class="mono-label">`, never an `<h2>`** (§11.3). An
 *      `<h2>` here would appear in the TOC and in the document outline as a
 *      section of the lesson, when it is in fact the lesson's answer. The TOC is
 *      built from Tiptap heading nodes, so the rule also keeps the two in sync.
 *   2. `<section aria-labelledby>` with a real heading is *not* used for the same
 *      reason. The block is labelled by its `aria-label` instead, so assistive
 *      tech announces a landmark without adding an outline node.
 *
 * This is also the passage AI answer engines retrieve, so it must be complete
 * text in the server HTML with no client dependency of any kind.
 */
export function AnswerBlock({
  label = "JAWABAN SINGKAT",
  children,
  fallback,
  standard,
  id,
  className,
}: AnswerBlockProps) {
  const body = children ?? (fallback ? <p className="body-lg text-foreground">{fallback}</p> : null);
  if (!body) return null;

  return (
    <section
      id={id}
      aria-label={label}
      className={cn(
        "relative rounded-lg border border-border bg-card p-6 md:p-8",
        "print:break-inside-avoid",
        className,
      )}
    >
      <CornerTicks size={12} />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="mono-label text-accent-text">{label}</p>
        {standard ? <p className="mono-spec text-muted-foreground">{standard}</p> : null}
      </div>
      <div
        className={cn(
          "mt-4 space-y-3 text-foreground",
          "[&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-2",
          "[&_p]:body-lg [&_p]:text-foreground",
        )}
      >
        {body}
      </div>
    </section>
  );
}
