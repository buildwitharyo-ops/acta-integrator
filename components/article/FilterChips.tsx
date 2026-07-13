import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterChips({
  base,
  paramName,
  categories,
  active,
}: {
  base: string;
  paramName: string;
  categories: { slug: string; name: string }[];
  active: string | null;
}) {
  const chipClass = (isActive: boolean) =>
    cn(
      "mono-label rounded-pill px-3 py-1.5 transition-colors",
      isActive
        ? "bg-primary/15 text-accent-text"
        : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
    );

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={base} className={chipClass(!active)}>
        Semua
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`${base}?${paramName}=${c.slug}`} className={chipClass(active === c.slug)}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
