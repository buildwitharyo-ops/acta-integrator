import { cn } from "@/lib/utils";

export type ComparisonColumn = {
  /** Key into each row object. */
  key: string;
  label: string;
  align?: "left" | "right";
  /** Render this column `mono-spec tabular-nums` — use it for every numeric column. */
  mono?: boolean;
  /** CSS width for the column, e.g. "12rem". */
  width?: string;
};

export type ComparisonRow = Readonly<Record<string, string>>;

export type ComparisonTableProps = {
  /** Visible `<caption>`. It also names the scroll region for assistive tech. */
  caption: string;
  columns: readonly ComparisonColumn[];
  rows: readonly ComparisonRow[];
  /** Source or method line under the table. */
  note?: string | null;
  /** Minimum table width before the container scrolls. Default "34rem". */
  minWidth?: string;
  id?: string;
  className?: string;
};

/**
 * The n-column comparison table (03-UI §11.3), extending the catalog spec-table
 * language.
 *
 * The whole point of this component is the scroll container: the table scrolls
 * inside its own `overflow-x-auto` box and **the page body never scrolls
 * horizontally**. On a 390px Android viewport — the device this platform is
 * budgeted for — a four-column comparison is genuinely wider than the screen,
 * and the two wrong answers are (a) letting it push the whole document sideways
 * and (b) hiding columns, which silently deletes the comparison.
 *
 * Accessibility details that are load-bearing rather than decorative:
 *   • the container is `tabIndex={0}` and labelled by the caption, because a
 *     scrollable region that cannot be reached by keyboard is a WCAG 2.2 failure;
 *   • the first column is `<th scope="row">`, so a screen reader announces which
 *     row a cell belongs to instead of reading a wall of values;
 *   • an edge fade marks that there is more to the right — `aria-hidden`, since
 *     it is a hint about geometry, not content.
 */
export function ComparisonTable({
  caption,
  columns,
  rows,
  note,
  minWidth = "34rem",
  id,
  className,
}: ComparisonTableProps) {
  if (columns.length === 0 || rows.length === 0) return null;

  const [firstColumn, ...restColumns] = columns;
  if (!firstColumn) return null;

  return (
    <figure id={id} className={cn("print:break-inside-avoid", className)}>
      <div className="relative">
        <div
          tabIndex={0}
          role="region"
          aria-label={caption}
          className={cn(
            "overflow-x-auto rounded-lg border border-border",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <table className="w-full border-collapse text-left" style={{ minWidth }}>
            <caption className="caption px-4 pb-3 pt-4 text-left text-muted-foreground">
              {caption}
            </caption>
            <thead>
              <tr className="border-y border-border bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "mono-label px-4 py-3 align-bottom text-muted-foreground",
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={i}>
                  <th
                    scope="row"
                    className={cn(
                      "px-4 py-3 align-top font-medium text-foreground",
                      firstColumn.mono ? "mono-spec" : "body-sm",
                      firstColumn.align === "right" && "text-right",
                    )}
                  >
                    {row[firstColumn.key] ?? ""}
                  </th>
                  {restColumns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-top",
                        col.mono ? "mono-spec text-foreground" : "body-sm text-foreground/85",
                        col.align === "right" && "text-right",
                      )}
                    >
                      {row[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l from-background to-transparent print:hidden"
        />
      </div>
      {note ? <figcaption className="caption mt-3 text-muted-foreground">{note}</figcaption> : null}
    </figure>
  );
}
