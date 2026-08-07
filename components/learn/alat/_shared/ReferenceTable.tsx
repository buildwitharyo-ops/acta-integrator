import { CornerTicks } from "@/components/shared/CornerTicks";
import { fmt } from "@/lib/learn/format";
import { cn } from "@/lib/utils";

export type ReferenceColumn = {
  /** Key looked up on every row. */
  key: string;
  label: string;
  align?: "left" | "right";
  /** Render the cells in mono tabular-nums. Numeric columns should set this. */
  mono?: boolean;
  /** Any CSS width, e.g. "12rem" — applied to the <col>. */
  width?: string;
};

export type ReferenceRow = Readonly<Record<string, string | number>>;

export type ReferenceTableProps = {
  /** Accessible name of the table, rendered as a visible <caption>. */
  caption: string;
  columns: readonly ReferenceColumn[];
  /**
   * Row objects keyed by column key. `number` values are printed through
   * `fmt()` (3 significant figures, decimal comma); strings pass through verbatim.
   * The first column is rendered as the row header.
   */
  rows: readonly ReferenceRow[];
  /** Source / caveat line under the table. */
  note?: string;
  /** Smallest width the table may occupy before the container scrolls. Default "34rem". */
  minWidth?: string;
  id?: string;
  className?: string;
};

function renderCell(value: string | number | undefined): string {
  if (value === undefined) return "";
  return typeof value === "number" ? fmt(value) : value;
}

/** Deterministic id for the <caption>, so the scroll region always has a name
 *  without a client-side hook. Pass `id` explicitly if two tables share a caption. */
function captionSlug(caption: string): string {
  const base = caption
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `reftab-${base || "tabel"}`;
}

/**
 * A static, linkable reference table (03-UI §12.6 item 7) — RT60 targets by room
 * type, α coefficients for Indonesian building materials, brightness targets.
 * Server-rendered, always in the HTML, horizontally scrollable on mobile inside a
 * keyboard-reachable labelled region.
 */
export function ReferenceTable({
  caption,
  columns,
  rows,
  note,
  minWidth = "34rem",
  id,
  className,
}: ReferenceTableProps) {
  const captionId = id ? `${id}-caption` : captionSlug(caption);
  const [firstColumn, ...restColumns] = columns;
  if (!firstColumn) return null;

  return (
    <div id={id} className={cn("print:break-inside-avoid", className)}>
      <div className="relative rounded-md border border-border bg-card">
        <CornerTicks size={8} />
        <div
          role="group"
          aria-labelledby={captionId}
          tabIndex={0}
          className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <table
            className="w-full border-collapse text-left"
            style={{ minWidth }}
          >
            <caption
              id={captionId}
              className="mono-label border-b border-border px-4 py-3 text-left text-muted-foreground"
            >
              {caption}
            </caption>
            <colgroup>
              {columns.map((column) => (
                <col
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "mono-label px-4 py-3 font-medium text-muted-foreground",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border/70 last:border-b-0"
                >
                  <th
                    scope="row"
                    className={cn(
                      "px-4 py-3 align-top font-medium text-foreground",
                      firstColumn.mono
                        ? "font-mono text-[0.8125rem] tabular-nums"
                        : "body-sm",
                      firstColumn.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {renderCell(row[firstColumn.key])}
                  </th>
                  {restColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 align-top text-muted-foreground",
                        column.mono
                          ? "font-mono text-[0.8125rem] tabular-nums"
                          : "body-sm",
                        column.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {renderCell(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {note ? (
        <p className="caption mt-3 max-w-[64ch] text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}
