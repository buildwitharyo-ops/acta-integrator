"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCompare, type CompareItem } from "./CompareProvider";

// "Bandingkan" toggle (06 §1.5) — cross-category disabled w/ tooltip; 5th same-category click toasts (handled in add()).
export function CompareCheckbox({ item, className }: { item: CompareItem; className?: string }) {
  const { has, add, remove, activeCategory } = useCompare();
  const checked = has(item.slug);
  const crossCategory = !checked && activeCategory != null && item.category_slug !== activeCategory;
  const id = `cmp-${item.slug}`;

  const control = (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex select-none items-center gap-2",
        crossCategory ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={crossCategory}
        onChange={(e) => (e.target.checked ? add(item) : remove(item.slug))}
      />
      <span className="mono-label text-muted-foreground">Bandingkan</span>
    </label>
  );

  if (!crossCategory) return control;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent>Bandingkan hanya untuk produk sekategori</TooltipContent>
    </Tooltip>
  );
}
