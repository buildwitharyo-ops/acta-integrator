import { slugify } from "@/lib/article";
import { cn } from "@/lib/utils";

export type SelfCheckOption = {
  text: string;
  /** Exactly one option per item should carry `correct: true`. */
  correct?: boolean;
};

export type SelfCheckItem = {
  question: string;
  /**
   * 2–4 options. Every distractor must be a real decision somebody in Indonesia
   * has actually made (01 §5.3) — a joke option teaches nothing and signals that
   * the block is filler. Benar/Salah items are just two options.
   */
  options: readonly SelfCheckOption[];
  /** The payload. One or two sentences explaining *why*, not restating the answer. */
  explanation: string;
  /** Heading id in this lesson that covers the item, e.g. "batas-rumus-ini". */
  anchor?: string | null;
};

export type SelfCheckProps = {
  items: readonly SelfCheckItem[];
  /** Default "CEK PEMAHAMAN". */
  title?: string;
  /** Overrides the standard framing line. */
  intro?: string | null;
  id?: string;
  className?: string;
};

const OPTION_LETTERS = ["a", "b", "c", "d", "e"] as const;

const DEFAULT_INTRO =
  "Tidak ada nilai, tidak ada skor, dan tidak ada yang disimpan. Pilih jawaban Anda, lalu buka penjelasannya.";

/**
 * CEK PEMAHAMAN — formative, never gatekeeping (01 §5.6, 03-UI §11.3).
 *
 * **No score, no persistence, no gate, no completion.** Nothing here is stored
 * anywhere, on the device or on a server: there are no quiz tables, no attempts,
 * no `%`, and no certificate at the end of any of it. Retrieval practice is the
 * only reason the block exists, and the explanation — not the answer — is the
 * payload.
 *
 * **Implementation: zero JavaScript.** Commitment comes from a native radio
 * group, and the per-option verdict is revealed by `peer-checked:` — the
 * correctness of every option is known at render time, so CSS alone can react to
 * the reader's choice. The explanation lives in a native `<details>`. That gives
 * the full interaction on the ~4× throttled mid-range Android this platform is
 * budgeted for, keeps the lesson route inside its 95 KB first-load budget, works
 * with JS disabled, and prints correctly once `<details>` is forced open.
 *
 * **The correct answer is in the server HTML on purpose** (03-UI §11.3). It is a
 * learning aid, not a secret; hiding it behind a fetch would buy nothing and cost
 * the crawler and screen-reader the content.
 *
 * Radios reset on reload and nothing is written anywhere, which is the honest
 * shape for a self-check: the reader owns the result and there is nothing to
 * "resume".
 */
export function SelfCheck({ items, title = "CEK PEMAHAMAN", intro, id, className }: SelfCheckProps) {
  const cleaned = items.filter((item) => item.question.trim() && item.options.length >= 2);
  if (cleaned.length === 0) return null;

  const framing = intro === null ? null : (intro ?? DEFAULT_INTRO);

  return (
    <section
      id={id}
      aria-label={title}
      className={cn(
        "rounded-lg border border-border bg-card p-5 md:p-6 print:break-inside-avoid",
        className,
      )}
    >
      <p className="mono-label text-muted-foreground">{title}</p>
      {framing ? <p className="body-sm mt-3 text-muted-foreground">{framing}</p> : null}

      <ol className="mt-6 space-y-8">
        {cleaned.map((item, itemIndex) => {
          // Deterministic and stable across server/client: derived from content,
          // never from a counter that a re-render could shift.
          const group = `sc-${slugify(item.question).slice(0, 32)}-${itemIndex}`;
          const correct = item.options.find((option) => option.correct);

          return (
            <li key={group}>
              <fieldset>
                <legend className="body-md font-medium text-foreground">
                  <span aria-hidden className="mono-spec mr-2 text-accent-text">
                    {String(itemIndex + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </legend>

                <div className="mt-3 space-y-1">
                  {item.options.map((option, optionIndex) => {
                    const optionId = `${group}-${optionIndex}`;
                    const isCorrect = option.correct === true;
                    return (
                      // The verdict span must be a DOM SIBLING of the input, not a
                      // descendant of one — `peer-checked:` compiles to `~`, which
                      // does not reach into a sibling's subtree. Grid placement,
                      // not nesting, does the layout.
                      <label
                        key={optionId}
                        htmlFor={optionId}
                        className={cn(
                          "grid min-h-11 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-start",
                          "gap-x-3 rounded-md px-2 py-2 hover:bg-muted/60",
                        )}
                      >
                        <input
                          id={optionId}
                          type="radio"
                          name={group}
                          value={String(optionIndex)}
                          className={cn(
                            "peer col-start-1 row-start-1 mt-0.5 h-5 w-5 shrink-0 cursor-pointer",
                            "appearance-none rounded-full border border-foreground/35 bg-transparent",
                            "checked:border-[6px]",
                            isCorrect ? "checked:border-status" : "checked:border-destructive",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          )}
                        />
                        <span className="body-md col-start-2 row-start-1 text-foreground">
                          <span aria-hidden className="mono-spec mr-2 text-muted-foreground">
                            {OPTION_LETTERS[optionIndex] ?? "•"}
                          </span>
                          {option.text}
                        </span>
                        <span
                          className={cn(
                            "mono-label col-start-2 row-start-2 mt-1.5 hidden peer-checked:block",
                            isCorrect ? "text-status-text" : "text-destructive",
                          )}
                        >
                          {isCorrect ? "TEPAT" : "BELUM TEPAT"}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <details className="group mt-3 rounded-md border border-border">
                  <summary
                    className={cn(
                      "mono-label flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-muted-foreground",
                      "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "[&::-webkit-details-marker]:hidden",
                    )}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 10 10"
                      className="h-2.5 w-2.5 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                    >
                      <path
                        d="M2 1 L7 5 L2 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="square"
                      />
                    </svg>
                    TAMPILKAN PENJELASAN
                  </summary>
                  <div className="space-y-2 border-t border-border px-3 py-3">
                    {correct ? (
                      <p className="body-sm text-foreground">
                        <span className="mono-label mr-2 text-status-text">JAWABAN</span>
                        {correct.text}
                      </p>
                    ) : null}
                    <p className="body-sm text-muted-foreground">{item.explanation}</p>
                    {item.anchor ? (
                      <p className="caption">
                        <a
                          href={`#${item.anchor}`}
                          className="text-accent-text underline underline-offset-2 hover:text-foreground"
                        >
                          Baca ulang bagian yang membahas ini ↑
                        </a>
                      </p>
                    ) : null}
                  </div>
                </details>
              </fieldset>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
