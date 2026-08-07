import Link from "next/link";
import { cn } from "@/lib/utils";

export type SpecRow = {
  /** Left column. Rendered `mono-label`, so keep it short: TUJUAN · PRASYARAT · ALAT. */
  label: string;
  /** Right column. Rendered `mono-spec tabular-nums`. */
  value: string;
  /** Optional destination for the value — a prerequisite lesson, a calculator. */
  href?: string | null;
};

export type SpecBlockProps = {
  rows: readonly SpecRow[];
  /** Mono eyebrow above the block, e.g. "RINGKASAN CEPAT". */
  title?: string | null;
  /** One line under the block. Used for the standards note. */
  note?: string | null;
  /**
   * `lesson` — the RINGKASAN CEPAT card at the top of a lesson.
   * `inline` — a spec pair list inside the body, no card frame.
   */
  variant?: "lesson" | "inline";
  id?: string;
  className?: string;
};

function isInternal(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * RINGKASAN CEPAT (01 §5.2 item 5) — the two-column `mono-label` / `mono-spec`
 * spec pair list, extending the catalog `SpecTable` language with a `lesson`
 * variant.
 *
 * ```
 * TUJUAN         Menghitung ukuran layar minimum dari jarak duduk terjauh
 * PRASYARAT      Membaca Denah Ruang & Menentukan Titik Duduk Terjauh · 5 menit
 * ALAT           Kalkulator Ukuran Layar → /learn/alat/ukuran-layar
 * BERLAKU        Ruang rapat · ruang kelas · ruang training · boardroom
 * TIDAK BERLAKU  Auditorium >15 m · videotron outdoor · signage
 * STANDAR        ANSI/AVIXA V202.01:2016 (DISCAS)
 * ```
 *
 * `TIDAK BERLAKU` is the row that earns the block. Stating where the method
 * stops is what separates an engineering document from marketing copy, and it is
 * the row a procurement reader checks first.
 *
 * Rendered as a `<dl>`: label/value pairs are exactly what a description list is
 * for, it keeps a screen reader from reading the grid as unrelated cells, and it
 * collapses to a stacked list on a phone without a horizontal scroll container.
 */
export function SpecBlock({ rows, title, note, variant = "lesson", id, className }: SpecBlockProps) {
  const cleaned = rows.filter((row) => row.label.trim() && row.value.trim());
  if (cleaned.length === 0) return null;

  return (
    <section
      id={id}
      aria-label={title ?? "Ringkasan"}
      className={cn(
        "print:break-inside-avoid",
        variant === "lesson" && "rounded-lg border border-border bg-card p-5 md:p-6",
        className,
      )}
    >
      {title ? <p className="mono-label text-muted-foreground">{title}</p> : null}
      <dl className={cn("divide-y divide-border", title && "mt-4")}>
        {cleaned.map((row, i) => (
          <div key={i} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
            <dt className="mono-label pt-0.5 text-muted-foreground">{row.label}</dt>
            <dd className="mono-spec text-foreground [overflow-wrap:anywhere]">
              {row.href ? (
                isInternal(row.href) ? (
                  <Link
                    href={row.href}
                    className="text-accent-text underline underline-offset-2 hover:text-foreground"
                  >
                    {row.value}
                  </Link>
                ) : (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener nofollow"
                    className="text-accent-text underline underline-offset-2 hover:text-foreground"
                  >
                    {row.value}
                  </a>
                )
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {note ? <p className="caption mt-4 text-muted-foreground">{note}</p> : null}
    </section>
  );
}
