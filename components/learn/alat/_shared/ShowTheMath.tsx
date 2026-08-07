import { CornerTicks } from "@/components/shared/CornerTicks";
import { cn } from "@/lib/utils";
import { AssumptionsList } from "./AssumptionsList";

export type MathStep = {
  /** What this step computes, e.g. "Volume ruang". */
  label: string;
  /** Symbolic form, e.g. "V = L × W × H". */
  formula: string;
  /** The same expression with the numbers substituted, e.g. "8,0 × 6,0 × 3,0". */
  substitution: string;
  /** The step's answer with its unit, e.g. "144 m³". */
  result: string;
  /** Optional one-line reason, e.g. "ᾱ ≤ 0,20 — Sabine berlaku". */
  note?: string;
};

export type ShowTheMathProps = {
  /** Ordered steps. Every value already formatted (decimal comma, 3 sig figs). */
  steps: readonly MathStep[];
  /** Assumption sentences printed under the steps. */
  assumptions?: readonly string[];
  /** Standard names for the header chip, e.g. ["AVIXA V202.01", "ISO 3382-1"]. */
  standards?: readonly string[];
  /** Printed verbatim in "Diverifikasi: {verifiedAt} · ACTA", e.g. "2026-07". */
  verifiedAt: string;
  /** true on tool pages, false in lesson embeds. Default false. */
  open?: boolean;
  /** Default "Tampilkan perhitungan". */
  summaryLabel?: string;
  /** Tool slug, emitted as data-learn-math for the learn_calc_show_math event. */
  tool?: string;
  id?: string;
  className?: string;
};

/**
 * The show-the-math affordance (03-UI §12.5) — a native <details>, server-rendered,
 * always present in the HTML. No JS, no modal, no accordion library. It prints the
 * SUBSTITUTED numbers, so an engineer can check the arithmetic in five seconds, and
 * it is the indexable, AI-retrievable payload on a page that would otherwise be an
 * empty form.
 */
export function ShowTheMath({
  steps,
  assumptions,
  standards,
  verifiedAt,
  open = false,
  summaryLabel = "Tampilkan perhitungan",
  tool,
  id,
  className,
}: ShowTheMathProps) {
  return (
    <details
      id={id}
      open={open}
      data-learn-math={tool}
      className={cn(
        "group relative rounded-md border border-border bg-card print:break-inside-avoid",
        className,
      )}
    >
      <CornerTicks size={8} />
      <summary
        className={cn(
          "flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3",
          "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="flex items-center gap-3">
          <svg
            aria-hidden
            viewBox="0 0 10 10"
            className="h-2.5 w-2.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
          >
            <path
              d="M2 1 L7 5 L2 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span className="body-sm font-medium text-foreground">
            {summaryLabel}
          </span>
        </span>
        {standards && standards.length > 0 ? (
          <span className="rounded-sm border border-border px-2 py-1 font-mono text-[0.75rem] leading-none tracking-[0.02em] text-muted-foreground">
            {standards.join(" · ")}
          </span>
        ) : null}
      </summary>

      <div className="border-t border-border px-4 py-5">
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li
              key={index}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-1"
            >
              <span
                aria-hidden
                className="pt-[0.2rem] font-mono text-[0.8125rem] leading-[1.4] tabular-nums text-muted-foreground"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="body-sm font-medium text-foreground">
                {step.label}
              </span>
              <span className="col-start-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[0.8125rem] leading-[1.5] tracking-[0.02em] tabular-nums [overflow-wrap:anywhere]">
                <span className="text-muted-foreground">{step.formula}</span>
                <span className="text-muted-foreground/60">=</span>
                <span className="text-foreground">{step.substitution}</span>
                <span className="text-muted-foreground/60">=</span>
                <span className="font-medium text-foreground">
                  {step.result}
                </span>
              </span>
              {step.note ? (
                <span className="caption col-start-2 text-muted-foreground">
                  {step.note}
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        {assumptions && assumptions.length > 0 ? (
          <AssumptionsList
            items={assumptions}
            className="mt-6 border-t border-border pt-5"
          />
        ) : null}

        <p className="mt-5 font-mono text-[0.75rem] leading-[1.4] tracking-[0.02em] text-muted-foreground">
          {`Diverifikasi: ${verifiedAt} · ACTA`}
        </p>
      </div>
    </details>
  );
}
