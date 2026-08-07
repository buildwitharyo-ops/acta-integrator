import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DiagramDatum = {
  label: string;
  value: string;
  /** Optional third column: where the number came from. */
  note?: string | null;
};

export type DiagramFigureProps = {
  /** SVG `<title>` / image alt. One sentence naming what is drawn. */
  title: string;
  /** SVG `<desc>`: the dimensions and the geometry, in words. */
  desc?: string | null;
  /** Visible caption under the figure. */
  caption?: string | null;
  /**
   * A hand-authored inline SVG. Strokes must be `currentColor`,
   * `hsl(var(--border))` or `hsl(var(--primary))` — never a hex literal, which
   * renders invisible in the Control Room dark theme (03-UI §11.6).
   */
  children?: ReactNode;
  /** Raster or uploaded-SVG fallback when there is no hand-authored diagram. */
  src?: string | null;
  /** Intrinsic pixel size of `src`. Required with `src` to reserve the box (CLS). */
  width?: number | null;
  height?: number | null;
  /**
   * The text twin. Every parameter and computed value as rows — this is what a
   * screen-reader user gets instead of "graphic", and what a retrieval engine
   * indexes instead of nothing.
   */
  data?: readonly DiagramDatum[];
  /** `<summary>` of the data table. Default "DATA DIAGRAM". */
  dataLabel?: string;
  /** Plain-text twin, rendered when neither `children` nor `src` is usable. */
  fallback?: string;
  id?: string;
  className?: string;
};

/**
 * The diagram wrapper (03-UI §12.7): inline SVG + `<figcaption>` + a `<details>`
 * data table.
 *
 * **Every diagram ships a text twin, and that is the cheapest defensible
 * advantage in this design.** One artifact does three jobs: a screen-reader user
 * gets numbers instead of "graphic"; every competitor's diagram is a JPEG and
 * therefore invisible to retrieval, while ACTA's diagram data is plain text under
 * a descriptive heading; and `<details>` is forced open in print, so the tender
 * folder gets the numbers.
 *
 * The component deliberately does **not** hold a diagram registry or a parametric
 * SVG engine. Diagrams are hand-authored and committed — there are three authors,
 * they are the CEO, CTO and COO, and a diagram editor they would touch a handful
 * of times a year is four to six developer-weeks that buys nothing.
 *
 * When rendering `src`, a plain `<img>` is used rather than `next/image`:
 * `next/image` refuses SVG without `dangerouslyAllowSVG`, and a diagram is a
 * fixed-size vector asset that gains nothing from the optimizer.
 */
export function DiagramFigure({
  title,
  desc,
  caption,
  children,
  src,
  width,
  height,
  data,
  dataLabel = "DATA DIAGRAM",
  fallback,
  id,
  className,
}: DiagramFigureProps) {
  const rows = (data ?? []).filter((row) => row.label.trim() && row.value.trim());
  const hasArtwork = Boolean(children) || Boolean(src);

  if (!hasArtwork && rows.length === 0) {
    return fallback ? <p className="body-lg text-foreground/85">{fallback}</p> : null;
  }

  return (
    <figure id={id} className={cn("print:break-inside-avoid", className)}>
      {hasArtwork ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card p-4 md:p-6">
          {children ?? (
            src ? (
              // eslint-disable-next-line @next/next/no-img-element -- vector diagram, fixed size, never optimized
              <img
                src={src}
                alt={title}
                width={width ?? undefined}
                height={height ?? undefined}
                loading="lazy"
                decoding="async"
                className="mx-auto h-auto w-full max-w-full"
              />
            ) : null
          )}
        </div>
      ) : null}

      {caption ? <figcaption className="caption mt-3 text-muted-foreground">{caption}</figcaption> : null}

      {rows.length > 0 ? (
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
              <path d="M2 1 L7 5 L2 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
            </svg>
            {dataLabel}
          </summary>
          <div className="border-t border-border">
            {desc ? <p className="body-sm px-3 pt-3 text-muted-foreground">{desc}</p> : null}
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{title}</caption>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <th scope="row" className="mono-label w-1/2 px-3 py-2.5 align-top text-muted-foreground">
                      {row.label}
                    </th>
                    <td className="mono-spec px-3 py-2.5 align-top text-foreground">
                      {row.value}
                      {row.note ? (
                        <span className="caption mt-1 block text-muted-foreground">{row.note}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  );
}
