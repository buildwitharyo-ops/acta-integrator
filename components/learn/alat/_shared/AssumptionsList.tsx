import { cn } from "@/lib/utils";

export type AssumptionsListProps = {
  /** One sentence per assumption, Bahasa Indonesia, authored in the tool's copy.id.ts. */
  items: readonly string[];
  /** Block heading. Rendered as a mono label (CSS uppercases it). Default "Asumsi". */
  title?: string;
  id?: string;
  className?: string;
};

/**
 * The assumptions block (03-UI §12.5): it tells a professional exactly how much
 * to trust the output, and why a site survey exists. Server-rendered static text,
 * always in the HTML.
 */
export function AssumptionsList({
  items,
  title = "Asumsi",
  id,
  className,
}: AssumptionsListProps) {
  if (items.length === 0) return null;

  return (
    <div id={id} className={cn("print:break-inside-avoid", className)}>
      <p className="mono-label text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="body-sm flex gap-3 text-muted-foreground [overflow-wrap:anywhere]"
          >
            <span
              aria-hidden
              className="mt-[0.65em] h-px w-3 shrink-0 bg-muted-foreground/60"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
