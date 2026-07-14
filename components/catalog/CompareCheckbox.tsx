"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCompare, type CompareItem } from "./CompareProvider";

// "Bandingkan" toggle (06 §1.5) — cross-type disabled w/ tooltip; 5th same-type click toasts (handled in add()).
// Mirrors add()'s type-match guard exactly (an untyped product can't match anything, not even
// another untyped one) — but deliberately excludes the COMPARE_MAX case, which stays toast-only
// on click (matches prior behavior; canAdd() alone can't be reused here since it also returns
// false at the cap, which would mislabel a full tray as a "different type" mismatch).
export function CompareCheckbox({ item, className }: { item: CompareItem; className?: string }) {
  const { has, add, remove, items, activeProductType } = useCompare();
  const checked = has(item.slug);
  // Gate on "is there an anchor at all" (items.length>0), NOT on activeProductType!=null — an
  // untyped anchor (activeProductType===null) must still block both untyped AND typed candidates.
  const hasAnchor = items.length > 0;
  const crossType = !checked && hasAnchor && (!item.product_type_slug || item.product_type_slug !== activeProductType);
  const id = `cmp-${item.slug}`;

  const control = (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex select-none items-center gap-2",
        crossType ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={crossType}
        onChange={(e) => (e.target.checked ? add(item) : remove(item.slug))}
      />
      <span className="mono-label text-muted-foreground">Bandingkan</span>
    </label>
  );

  if (!crossType) return control;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent>Bandingkan hanya untuk produk dengan tipe yang sama</TooltipContent>
    </Tooltip>
  );
}
