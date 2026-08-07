import { cn } from "@/lib/utils";

export type ResultTone = "neutral" | "good" | "warning" | "bad";

export type ResultReadoutProps = {
  /** Mono eyebrow above the number, e.g. "WAKTU DENGUNG · T_MID". */
  label: string;
  /** Already formatted through lib/learn/format — this component never rounds. */
  value: string;
  /** Printed at a smaller size on the number's baseline. */
  unit?: string;
  /** One short sentence of context under the number. */
  caption?: string;
  /** Short verdict sentence; takes its colour from `tone`. */
  verdict?: string;
  /** neutral = no judgement · good = within target · warning = marginal · bad = fails. */
  tone?: ResultTone;
  /** "lg" for the one headline answer, "md" for secondary readouts. Default "lg". */
  size?: "lg" | "md";
  id?: string;
  className?: string;
};

const RULE_TONE: Record<ResultTone, string> = {
  neutral: "bg-border",
  good: "bg-status",
  warning: "bg-primary",
  bad: "bg-destructive",
};

const VERDICT_TONE: Record<ResultTone, string> = {
  neutral: "ring-border text-muted-foreground",
  good: "ring-status/45 text-status-text",
  warning: "ring-primary/45 text-accent-text",
  bad: "ring-destructive/45 text-destructive",
};

/**
 * The headline number. Mono tabular-nums, labelled, unit-qualified — a readout on
 * an instrument, not a marketing stat (13 O4/C5: no naked oversized figure, no
 * count-up). The number itself stays `text-foreground`; the tone colours only the
 * edge rule and the verdict chip, which keeps the page inside its amber budget.
 */
export function ResultReadout({
  label,
  value,
  unit,
  caption,
  verdict,
  tone = "neutral",
  size = "lg",
  id,
  className,
}: ResultReadoutProps) {
  return (
    <div
      id={id}
      className={cn("flex gap-4 print:break-inside-avoid", className)}
    >
      <span aria-hidden className={cn("w-0.5 shrink-0", RULE_TONE[tone])} />
      <div className="min-w-0">
        <p className="mono-label text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-2 flex flex-wrap items-baseline gap-x-2 font-mono tabular-nums text-foreground [overflow-wrap:anywhere]",
            size === "lg"
              ? "text-[2.25rem] leading-[1.05] md:text-[3rem]"
              : "text-2xl leading-[1.1] md:text-[1.75rem]",
          )}
        >
          <span className="font-medium">{value}</span>
          {unit ? (
            <span
              className={cn(
                "font-normal text-muted-foreground",
                size === "lg" ? "text-base md:text-lg" : "text-sm md:text-base",
              )}
            >
              {unit}
            </span>
          ) : null}
        </p>
        {verdict ? (
          <p
            className={cn(
              "mt-3 inline-block rounded-sm px-2.5 py-1.5 font-mono text-[0.8125rem] leading-[1.4] tracking-[0.02em] ring-1",
              VERDICT_TONE[tone],
            )}
          >
            {verdict}
          </p>
        ) : null}
        {caption ? (
          <p className="body-sm mt-3 max-w-[46ch] text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
