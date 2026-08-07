import Link from "next/link";
import { glossaryLetterAnchor } from "@/lib/learn/glossary";
import { cn } from "@/lib/utils";

/**
 * The A–Z jump navigation for `/learn/glosarium`.
 *
 * **Server component, zero client JavaScript**, because the glossary has to clear
 * a 90+ mobile Lighthouse score with ~54 entries on one URL (04-ROADMAP §17.3
 * exit criterion 3). Every affordance here is a plain `<a href="#huruf-x">`, so
 * it works with JavaScript disabled, survives "open in new tab", and costs the
 * main thread nothing. Smooth scrolling, if it is ever wanted, belongs in CSS
 * behind `prefers-reduced-motion`, not in a listener.
 *
 * Letters with no term behind them render as inert text, never as a link. A
 * jump-nav that navigates to nothing is worse than a shorter jump-nav, and
 * disabling them keeps the tab order to exactly the destinations that exist.
 *
 * Sticky on desktop only. On a phone it is a single horizontally scrollable row
 * above the list — a rail pinned to a 400px-tall viewport spends screen the
 * content needs.
 */

export type GlossaryIndexLetter = { letter: string; count: number };

export type GlossaryIndexProps = {
  letters: readonly GlossaryIndexLetter[];
  /** Total number of terms, printed as a fact — never as a growth counter. */
  total: number;
  /** Accessible name of the nav landmark. */
  label?: string;
  className?: string;
};

export function GlossaryIndex({
  letters,
  total,
  label = "Lompat ke huruf",
  className,
}: GlossaryIndexProps) {
  return (
    <nav
      aria-label={label}
      className={cn("lg:sticky lg:top-28", className)}
    >
      <p className="mono-label text-muted-foreground">{label}</p>

      <ul
        className={cn(
          // Phone: one scrolling row. Desktop: a dense grid in the rail.
          "mt-3 flex gap-1 overflow-x-auto pb-2",
          "lg:mt-4 lg:grid lg:grid-cols-6 lg:gap-1 lg:overflow-visible lg:pb-0",
        )}
      >
        {letters.map(({ letter, count }) => {
          const key = letter;
          if (count === 0) {
            return (
              <li key={key} className="shrink-0">
                <span
                  aria-hidden
                  className={cn(
                    "mono-spec grid h-9 w-9 place-content-center rounded-sm",
                    "border border-transparent text-muted-foreground/35",
                  )}
                >
                  {letter}
                </span>
              </li>
            );
          }
          return (
            <li key={key} className="shrink-0">
              <Link
                href={`#${glossaryLetterAnchor(letter)}`}
                aria-label={`${letter} — ${count} istilah`}
                className={cn(
                  "mono-spec grid h-9 w-9 place-content-center rounded-sm border border-border",
                  "bg-card text-foreground transition-colors hover:border-primary/60",
                  "hover:text-accent-text focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-ring focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-background",
                )}
              >
                {letter}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mono-spec mt-4 text-muted-foreground">
        {total} istilah · satu halaman
      </p>
      <p className="caption mt-2 max-w-[32ch] text-muted-foreground">
        Satu URL, satu jangkar per istilah. Tidak ada halaman terpisah per kata.
      </p>
    </nav>
  );
}
