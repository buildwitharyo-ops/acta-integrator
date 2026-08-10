import type { ReactNode } from "react";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { cn } from "@/lib/utils";

export type WidgetShellProps = {
  /** Bare tool path, e.g. "/learn/alat/rt60-sabine". Used as the form action and
   *  as the href of the reset link, so both work with zero JavaScript. */
  action: string;
  /** Section heading. Rendered as <h2> — the page owns the single <h1>. */
  title: string;
  /** Mono label above the title, e.g. "ALAT 02 · SABINE / EYRING". */
  eyebrow?: string;
  /** Lede paragraph(s) explaining what the tool answers. */
  intro?: ReactNode;
  /** Legend of the input fieldset. Default "Parameter". */
  fieldsLabel?: string;
  /** The input fields. Sits inside <form method="GET">, so every field needs a
   *  real `name`. May be a server-rendered list of fields or a client Panel. */
  children: ReactNode;
  /** Default "Hitung". */
  submitLabel?: string;
  /** Default "Atur ulang". */
  resetLabel?: string;
  /** Accessible name of the result region. Default "Hasil perhitungan". */
  resultLabel?: string;
  /** The computed answer for the URL's params (or the defaults). Required: the
   *  server must render a complete result before any JS runs. */
  result: ReactNode;
  /** <ShowTheMath />. */
  math?: ReactNode;
  /** Worked examples — realistic Indonesian rooms, fully computed, always present. */
  examples?: ReactNode;
  /** Reference tables, standards list, refusal copy. */
  reference?: ReactNode;
  id?: string;
  className?: string;
};

/**
 * Layout + no-JS contract for a calculator page (03-UI §12.6).
 *
 * The native GET form is the PRIMARY implementation, not a fallback: submitting
 * reloads the page with params, the server computes, and the full result renders.
 * A client Panel progressively enhances the same markup — it never replaces it.
 */
export function WidgetShell({
  action,
  title,
  eyebrow,
  intro,
  fieldsLabel = "Parameter",
  children,
  submitLabel = "Hitung",
  resetLabel = "Atur ulang",
  resultLabel = "Hasil perhitungan",
  result,
  math,
  examples,
  reference,
  id,
  className,
}: WidgetShellProps) {
  // Deterministic (no client hook): the bare tool path is unique per page.
  const slug = action.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const titleId = `${id ?? `alat-${slug}`}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("scroll-mt-24", className)}
    >
      <header className="max-w-[52ch]">
        {eyebrow ? (
          <p className="mono-label text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h2 id={titleId} className={cn("display-md", eyebrow && "mt-3")}>
          {title}
        </h2>
        {intro ? (
          <div className="body-lg mt-4 text-muted-foreground">{intro}</div>
        ) : null}
      </header>

      {/* `min-w-0` on both columns is load-bearing, not cosmetic.
          A grid item's automatic minimum size is its min-content width, and a
          <select>'s min-content width is its widest <option> — "Plafon gypsum
          9 mm pada rangka + plenum" and friends. Without this the whole form
          refused to shrink below ~750 px and every /learn calculator scrolled
          sideways on a phone. */}
      <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <form
          method="GET"
          action={action}
          className="relative min-w-0 rounded-md border border-border bg-card p-5 md:p-6 lg:col-span-5"
        >
          <CornerTicks size={10} />
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mono-label text-muted-foreground">
              {fieldsLabel}
            </legend>
            <div className="mt-5 space-y-5">{children}</div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-pill bg-primary px-7 text-[0.95rem] font-medium text-primary-foreground ring-1 ring-primary/40 transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {submitLabel}
            </button>
            <a
              href={action}
              className="body-sm inline-flex min-h-11 items-center text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {resetLabel}
            </a>
          </div>

          <p className="caption mt-4 text-muted-foreground">
            Perhitungan dijalankan di server. Kalkulator ini tetap berfungsi
            penuh tanpa JavaScript.
          </p>
        </form>

        <div className="min-w-0 space-y-6 lg:col-span-7">
          <div
            role="region"
            aria-label={resultLabel}
            aria-live="polite"
            data-widget-result
            className="texture-grid relative rounded-md border border-border bg-card p-5 md:p-6 print:break-inside-avoid"
          >
            <CornerTicks size={10} />
            {result}
          </div>
          {math}
        </div>
      </div>

      {examples ? <div className="mt-14">{examples}</div> : null}
      {reference ? <div className="mt-12">{reference}</div> : null}
    </section>
  );
}
