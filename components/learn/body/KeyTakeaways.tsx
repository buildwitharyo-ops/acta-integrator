import { MeterDivider } from "@/components/shared/MeterDivider";
import { cn } from "@/lib/utils";

export type KeyTakeawaysProps = {
  /**
   * 3–5 takeaways. Each one a complete sentence carrying a number
   * (01 §5.3): `"Ruang rapat 6,4 m dengan slide font 20pt butuh ±115\" —
   * display 86\" hanya layak sampai 4,8 m."` — never `"Jarak pandang penting"`.
   */
  items: readonly string[];
  /** Default "INTI". */
  title?: string;
  id?: string;
  className?: string;
};

/** Soft cap from 01 §5.3 — beyond five, nothing is a takeaway any more. */
const MAX_ITEMS = 5;

/**
 * INTI — the screenshot-able unit (01 §5.2 item 10, §5.3).
 *
 * This block is designed for one specific real-world distribution mechanism:
 * somebody screenshots it and drops it into a WhatsApp group, which is how
 * Indonesian B2B content actually travels. Three consequences shape the markup:
 *
 *   • **Mono `01/02/03` indices, no icons in circles** (13 C1). The index is a
 *     reference the reader can quote back in the group chat; a circled check mark
 *     is decoration that survives no screenshot crop.
 *   • **A hairline top rule, not a filled amber panel.** The amber budget on a
 *     lesson page is spent by the CTA and the TOC's active marker (T-budget, max
 *     2 amber elements per viewport); a filled block here would overdraw it.
 *   • **Numbers stay `mono-spec tabular-nums` inside prose** by inheriting the
 *     body class — the takeaway is a sentence, not a stat card (13 O4).
 *
 * Rendered as an ordered list so the indices are real semantics, not text.
 */
export function KeyTakeaways({ items, title = "INTI", id, className }: KeyTakeawaysProps) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean).slice(0, MAX_ITEMS);
  if (cleaned.length === 0) return null;

  return (
    <section id={id} aria-label={title} className={cn("print:break-inside-avoid", className)}>
      <MeterDivider annotation={title} />
      <ol className="mt-6 space-y-4">
        {cleaned.map((item, i) => (
          <li key={i} className="flex gap-4">
            <span aria-hidden className="mono-spec shrink-0 pt-1 text-accent-text">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="body-md text-foreground">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
