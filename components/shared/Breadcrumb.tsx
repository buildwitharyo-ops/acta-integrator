import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; href?: string };

// Visible breadcrumb (03 §6.1) — mirror it 1:1 with the BreadcrumbList JSON-LD.
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="mono-label flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-x-2">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(last && "text-foreground")}
                >
                  {item.name}
                </span>
              )}
              {last ? null : <span aria-hidden className="text-muted-foreground/40">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
