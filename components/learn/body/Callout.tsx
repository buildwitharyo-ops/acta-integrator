import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CALLOUT_VARIANTS = ["catatan", "peringatan", "standar", "lapangan"] as const;

export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export function isCalloutVariant(value: unknown): value is CalloutVariant {
  return typeof value === "string" && (CALLOUT_VARIANTS as readonly string[]).includes(value);
}

export type CalloutProps = {
  variant: CalloutVariant;
  /** Overrides the variant's default eyebrow. */
  title?: string | null;
  /**
   * Attribution line. On `standar` this is the document and version
   * ("ANSI/AVIXA V202.01:2016"); on `lapangan` it is the room and year
   * ("Ruang rapat 42 m², Jakarta Selatan · 2025") — never a client name.
   */
  source?: string | null;
  children?: ReactNode;
  /** Plain-text twin, rendered when `children` is empty. */
  fallback?: string;
  id?: string;
  className?: string;
};

const DEFAULT_TITLE: Record<CalloutVariant, string> = {
  catatan: "CATATAN",
  peringatan: "PERHATIAN",
  standar: "STANDAR",
  lapangan: "DARI LAPANGAN",
};

const FRAME: Record<CalloutVariant, string> = {
  // Neutral hairline — an aside, not an alarm.
  catatan: "border border-border bg-card",
  // Amber left rule only. A filled amber panel would eat the page's amber budget.
  peringatan: "border-l-2 border-primary bg-primary/[0.06] pl-5",
  // Mono, muted surface — it is a citation, and it should read like one.
  standar: "border border-border bg-muted/50",
  // The differentiator: a field note. Dashed rule marks it as human testimony.
  lapangan: "border border-dashed border-foreground/25 bg-card",
};

const EYEBROW: Record<CalloutVariant, string> = {
  catatan: "text-muted-foreground",
  peringatan: "text-accent-text",
  standar: "text-muted-foreground",
  lapangan: "text-accent-text",
};

const BODY: Record<CalloutVariant, string> = {
  catatan: "body-md text-foreground/85",
  peringatan: "body-md text-foreground",
  standar: "mono-spec text-foreground/85",
  lapangan: "body-md text-foreground/85",
};

/**
 * The four lesson-body callouts (03-UI §11.3).
 *
 * `lapangan` is the one that matters commercially. No competitor in this market
 * has field notes, because writing one requires having installed the system —
 * it is the most direct expression of *"belajar dari orang yang memasangnya"*,
 * and it is the copyright hook: an unambiguously human-authored original element
 * on every lesson, which is exactly what an AI-generated competitor page cannot
 * produce and what an AI answer engine cannot flatten into a summary.
 *
 * `standar` is the honesty valve. ACTA needs figures no standard supplies; this
 * variant marks the ones that *do* come from a named, versioned document, so the
 * house numbers are visibly distinguishable from the cited ones (01 §5.2 SUMBER).
 *
 * Every variant is a plain `<aside>` with a hairline or a rule — no icon, no
 * coloured pill, no emoji (13 C1). Colour carries at most the left rule, so a
 * page can hold several callouts without breaking the amber budget.
 */
export function Callout({ variant, title, source, children, fallback, id, className }: CalloutProps) {
  const body = children ?? (fallback ? <p>{fallback}</p> : null);
  if (!body) return null;

  const heading = title === null ? null : (title ?? DEFAULT_TITLE[variant]);

  return (
    <aside
      id={id}
      aria-label={heading ?? DEFAULT_TITLE[variant]}
      data-callout={variant}
      className={cn(
        "rounded-lg p-5 md:p-6 print:break-inside-avoid",
        variant === "peringatan" && "rounded-none rounded-r-lg",
        FRAME[variant],
        className,
      )}
    >
      {heading ? <p className={cn("mono-label", EYEBROW[variant])}>{heading}</p> : null}
      <div
        className={cn(
          heading && "mt-3",
          "space-y-3",
          "[&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-2",
          BODY[variant],
        )}
      >
        {body}
      </div>
      {source ? <p className="caption mt-4 text-muted-foreground">{source}</p> : null}
    </aside>
  );
}
