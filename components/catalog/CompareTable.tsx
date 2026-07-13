"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { Switch } from "@/components/ui/switch";
import { mediaUrl } from "@/lib/media";
import type { CatalogSpecValue, CompareProduct, SpecDefinition } from "@/lib/queries/products";
import { cn } from "@/lib/utils";
import { useCompare } from "./CompareProvider";

function formatValue(sv: CatalogSpecValue | undefined): string {
  if (!sv) return "—";
  if (sv.data_type === "boolean") return sv.value_boolean == null ? "—" : sv.value_boolean ? "Ya" : "Tidak";
  if (sv.data_type === "enum") {
    const opts = (sv.value_options ?? []).filter(Boolean);
    return opts.length ? opts.join(", ") : sv.value_text ?? "—";
  }
  if (sv.data_type === "number") {
    const base = sv.value_text ?? (sv.value_number != null ? String(sv.value_number) : "");
    return `${base}${sv.unit ? ` ${sv.unit}` : ""}`.trim() || "—";
  }
  return sv.value_text ?? "—";
}

export function CompareTable({ products, specDefs }: { products: CompareProduct[]; specDefs: SpecDefinition[] }) {
  const router = useRouter();
  const { remove: removeFromTray } = useCompare();
  const [onlyDiff, setOnlyDiff] = useState(false);

  const comparable = useMemo(
    () => specDefs.filter((d) => d.is_comparable && d.key).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [specDefs],
  );

  // Group defs by spec_group, preserving first-seen order.
  const groups = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, SpecDefinition[]> = {};
    for (const d of comparable) {
      const g = d.spec_group ?? "Spesifikasi";
      if (!map[g]) {
        map[g] = [];
        order.push(g);
      }
      map[g]!.push(d);
    }
    return order.map((g) => ({ group: g, defs: map[g]! }));
  }, [comparable]);

  const rowMeta = useMemo(() => {
    const meta = new Map<string, { differs: boolean; best: Set<string> }>();
    for (const d of comparable) {
      const key = d.key as string;
      const displays = products.map((p) => formatValue(p.specValues[key]));
      const differs = new Set(displays).size > 1;
      const best = new Set<string>();
      if (d.data_type === "number" && d.better_direction) {
        const nums = products
          .map((p) => ({ id: p.id ?? p.slug ?? "", n: p.specValues[key]?.value_number ?? null }))
          .filter((x): x is { id: string; n: number } => x.n != null);
        if (nums.length > 1) {
          const target =
            d.better_direction === "higher"
              ? Math.max(...nums.map((x) => x.n))
              : Math.min(...nums.map((x) => x.n));
          for (const x of nums) if (x.n === target) best.add(x.id);
        }
      }
      meta.set(key, { differs, best });
    }
    return meta;
  }, [comparable, products]);

  const removeProduct = (slug: string | null) => {
    if (!slug) return;
    const next = products.map((p) => p.slug).filter((s): s is string => Boolean(s) && s !== slug);
    removeFromTray(slug);
    if (next.length >= 2) router.replace(`/products/compare?items=${next.join(",")}`);
    else router.replace(next.length === 1 ? `/products/compare?items=${next[0]}` : "/products/compare");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link perbandingan disalin");
    } catch {
      toast("Gagal menyalin link");
    }
  };

  const colWidth = "min-w-[168px]";
  const allNames = products.map((p) => p.name ?? p.slug ?? "").filter(Boolean);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <Switch checked={onlyDiff} onCheckedChange={setOnlyDiff} />
          Tampilkan hanya perbedaan
        </label>
        <button
          type="button"
          onClick={copyLink}
          className="mono-label inline-flex items-center gap-2 rounded-pill border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          Salin link perbandingan
        </button>
      </div>

      <p className="mono-spec mt-4 text-muted-foreground lg:hidden">← geser untuk melihat semua →</p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border lg:overflow-x-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 top-16 z-30 w-[160px] min-w-[140px] border-b border-r border-border bg-background p-3" />
              {products.map((p) => {
                const img = mediaUrl(p.image);
                return (
                  <th
                    key={p.id ?? p.slug}
                    className={cn("sticky top-16 z-20 border-b border-l border-border bg-background p-3 align-top", colWidth)}
                  >
                    <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
                      {img ? (
                        <Image src={img} alt={p.name ?? "Produk"} fill sizes="64px" className="object-contain p-1" />
                      ) : null}
                    </div>
                    <p className="mono-label mt-2 text-muted-foreground">{p.brand_name}</p>
                    <p className="heading-md mt-0.5 text-sm leading-tight">{p.name}</p>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.slug)}
                      className="caption mt-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Hapus
                    </button>
                    <WhatsAppCTA
                      context="product"
                      name={p.name ?? undefined}
                      label="Minta Penawaran"
                      size="sm"
                      buttonVariant="secondary"
                      trackContext="compare"
                      className="mt-2.5 w-full"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ group, defs }) => {
              const visibleDefs = defs.filter((d) => !onlyDiff || rowMeta.get(d.key as string)?.differs);
              if (visibleDefs.length === 0) return null;
              return (
                <Fragment key={group}>
                  <tr>
                    <th
                      colSpan={products.length + 1}
                      className="mono-label sticky left-0 border-b border-t border-border bg-muted/60 px-3 py-2 text-left text-muted-foreground"
                    >
                      {group}
                    </th>
                  </tr>
                  {visibleDefs.map((d) => {
                    const key = d.key as string;
                    const meta = rowMeta.get(key);
                    return (
                      <tr key={key} className={cn(meta?.differs && "bg-primary/[0.05]")}>
                        <th
                          scope="row"
                          className="body-sm sticky left-0 z-10 border-r border-t border-border bg-background px-3 py-2.5 text-left font-normal text-muted-foreground"
                        >
                          {d.label}
                        </th>
                        {products.map((p) => {
                          const id = p.id ?? p.slug ?? "";
                          const sv = p.specValues[key];
                          const isBest = meta?.best.has(id);
                          const isDiffCell = Boolean(meta?.differs) && formatValue(sv) !== "—";
                          return (
                            <td
                              key={id}
                              className={cn("mono-spec border-l border-t border-border px-3 py-2.5 align-top text-foreground", colWidth)}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {isBest ? (
                                  <span aria-label="Nilai terbaik di baris ini" title="Nilai terbaik di baris ini" className="text-primary">
                                    ▲
                                  </span>
                                ) : null}
                                <span className={cn(!sv && "text-muted-foreground/50")}>{formatValue(sv)}</span>
                                {isDiffCell && !isBest ? <span className="h-1 w-1 rounded-full bg-primary/70" /> : null}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="heading-md">Bingung memilih?</p>
          <p className="body-sm mt-1 text-muted-foreground">
            Konsultasikan konfigurasi yang tepat — kami bantu putuskan berdasarkan kebutuhan ruang Anda.
          </p>
        </div>
        <WhatsAppCTA
          context="compare"
          items={allNames}
          label="Konsultasikan Pilihan"
          emphasis="orbit"
          trackContext="compare"
        />
      </div>
    </div>
  );
}
