"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";
import {
  applyFilters,
  buildQuery,
  EMPTY_FILTERS,
  hasActiveFilters,
  numericBuckets,
  parseFilters,
  type FilterState,
  type SortKey,
} from "@/lib/catalog";
import type { CatalogProduct, SpecDefinition } from "@/lib/queries/products";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { FilterSidebar, type SpecFacet } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";

const BATCH = 24;

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Terbaru",
  brand: "Brand A–Z",
  name: "Nama A–Z",
};

type Props = {
  products: CatalogProduct[];
  categories: { slug: string; name: string }[];
  solutions: { id: string; slug: string; name: string }[];
  specDefs: SpecDefinition[];
  forcedCategory?: string;
  basePath?: string;
};

export function CatalogBrowser({
  products,
  categories,
  solutions,
  specDefs,
  forcedCategory,
  basePath = "/products",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const specKeys = useMemo(
    () => new Set(specDefs.filter((d) => d.is_filterable && d.key).map((d) => d.key as string)),
    [specDefs],
  );

  const urlState = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString()), specKeys),
    [searchParams, specKeys],
  );
  const state = useMemo<FilterState>(
    () => (forcedCategory ? { ...urlState, category: forcedCategory } : urlState),
    [urlState, forcedCategory],
  );

  const [qInput, setQInput] = useState(state.q);
  const [visible, setVisible] = useState(BATCH);
  const [sheetOpen, setSheetOpen] = useState(false);

  const solutionSlugToId = useMemo(() => new Map(solutions.map((s) => [s.slug, s.id])), [solutions]);
  const specDefsByKey = useMemo(
    () => new Map(specDefs.filter((d) => d.key).map((d) => [d.key as string, d])),
    [specDefs],
  );
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.slug, c.name])),
    [categories],
  );
  const filterOpts = useMemo(() => ({ solutionSlugToId, specDefsByKey }), [solutionSlugToId, specDefsByKey]);

  const commit = useCallback(
    (next: FilterState, { filterEvent = false } = {}) => {
      const persisted = forcedCategory ? { ...next, category: null } : next;
      const qs = buildQuery(persisted);
      startTransition(() => {
        router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
      if (filterEvent) trackEvent("catalog_filter", { category: next.category, brands: next.brands, solutions: next.solutions });
    },
    [basePath, forcedCategory, router],
  );

  // Latest state for the debounce timer — avoids a stale closure reverting facets applied mid-debounce.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Debounced search → URL (300ms, min 2 chars — 06 §1.3). Reads the freshest state via ref.
  useEffect(() => {
    const handle = setTimeout(() => {
      const current = stateRef.current;
      const trimmed = qInput.trim();
      const nextQ = trimmed.length >= 2 ? trimmed : "";
      if (nextQ !== current.q) commit({ ...current, q: nextQ });
    }, 300);
    return () => clearTimeout(handle);
  }, [qInput, commit]);

  // Keep the input in sync when q changes from outside (chip removal / reset).
  useEffect(() => setQInput(state.q), [state.q]);

  // Reset the load-more window whenever the effective query changes.
  const queryKey = searchParams.toString();
  useEffect(() => setVisible(BATCH), [queryKey]);

  const activeCategory = forcedCategory ?? state.category;
  const inCategory = useMemo(
    () => (activeCategory ? products.filter((p) => p.category_slug === activeCategory) : products),
    [products, activeCategory],
  );

  const brandFacets = useMemo(() => {
    const base = applyFilters(products, { ...state, brands: [] }, filterOpts);
    const counts = new Map<string, number>();
    for (const p of base) if (p.brand_slug) counts.set(p.brand_slug, (counts.get(p.brand_slug) ?? 0) + 1);
    const names = new Map<string, string>();
    for (const p of inCategory) if (p.brand_slug) names.set(p.brand_slug, p.brand_name ?? p.brand_slug);
    return [...names.entries()]
      .map(([slug, name]) => ({ slug, name, count: counts.get(slug) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, inCategory, state, filterOpts]);

  const solutionFacets = useMemo(() => {
    const present = new Set<string>();
    for (const p of inCategory) for (const id of p.solution_ids) present.add(id);
    return solutions
      .filter((s) => present.has(s.id))
      .map((s) => ({ slug: s.slug, name: s.name }));
  }, [inCategory, solutions]);

  const specFacets = useMemo<SpecFacet[]>(() => {
    if (!activeCategory) return [];
    const defs = specDefs
      .filter((d) => d.category_slug === activeCategory && d.is_filterable && d.key)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const out: SpecFacet[] = [];
    for (const d of defs) {
      const key = d.key as string;
      const label = d.label ?? key;
      if (d.data_type === "number") {
        const values = inCategory
          .map((p) => p.specs.find((s) => s.key === key)?.value_number)
          .filter((v): v is number => v != null);
        const buckets = numericBuckets(values, d.unit ?? null);
        if (buckets.length) out.push({ key, label, kind: "number", buckets, options: [] });
      } else if (d.data_type === "boolean") {
        const anyTrue = inCategory.some((p) => p.specs.find((s) => s.key === key)?.value_boolean === true);
        const anyFalse = inCategory.some((p) => p.specs.find((s) => s.key === key)?.value_boolean === false);
        if (anyTrue && anyFalse) out.push({ key, label, kind: "boolean", buckets: [], options: [] });
      } else {
        const set = new Set<string>();
        for (const p of inCategory) {
          const sv = p.specs.find((s) => s.key === key);
          for (const o of sv?.value_options ?? []) set.add(o);
        }
        const options = [...set].sort();
        if (options.length > 1) out.push({ key, label, kind: "enum", buckets: [], options });
      }
    }
    return out;
  }, [activeCategory, specDefs, inCategory]);

  const results = useMemo(() => applyFilters(products, state, filterOpts), [products, state, filterOpts]);
  const shown = results.slice(0, visible);
  const active = hasActiveFilters(state);

  // Handlers
  const setCategory = (slug: string | null) =>
    commit({ ...EMPTY_FILTERS, sort: state.sort, category: slug }, { filterEvent: true });
  const toggleBrand = (slug: string) =>
    commit(
      { ...state, brands: state.brands.includes(slug) ? state.brands.filter((b) => b !== slug) : [...state.brands, slug] },
      { filterEvent: true },
    );
  const toggleSolution = (slug: string) =>
    commit(
      {
        ...state,
        solutions: state.solutions.includes(slug)
          ? state.solutions.filter((s) => s !== slug)
          : [...state.solutions, slug],
      },
      { filterEvent: true },
    );
  const toggleSpec = (key: string, token: string) => {
    const current = state.specs[key] ?? [];
    const nextTokens = current.includes(token) ? current.filter((t) => t !== token) : [...current, token];
    const specs = { ...state.specs };
    if (nextTokens.length) specs[key] = nextTokens;
    else delete specs[key];
    commit({ ...state, specs }, { filterEvent: true });
  };
  const setSort = (sort: SortKey) => commit({ ...state, sort });
  const reset = () => {
    setQInput("");
    commit({ ...EMPTY_FILTERS, sort: state.sort, category: forcedCategory ? forcedCategory : null });
  };

  const sidebar = (
    <FilterSidebar
      categories={categories}
      brandFacets={brandFacets}
      solutionFacets={solutionFacets}
      specFacets={specFacets}
      state={state}
      forcedCategory={forcedCategory}
      onCategory={setCategory}
      onToggleBrand={toggleBrand}
      onToggleSolution={toggleSolution}
      onToggleSpec={toggleSpec}
    />
  );

  const chips = buildChips(state, {
    categoryName,
    solutionName: (slug) => solutions.find((s) => s.slug === slug)?.name ?? slug,
    brandName: (slug) => brandFacets.find((b) => b.slug === slug)?.name ?? slug,
    specLabel: (key) => specDefsByKey.get(key)?.label ?? key,
    forcedCategory,
  });

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24">{sidebar}</div>
      </aside>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-label text-muted-foreground">
            {results.length} PRODUK
            {activeCategory ? ` · ${(categoryName.get(activeCategory) ?? activeCategory).toUpperCase()}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-pill px-4 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-card lg:hidden">
                Filter
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="mono-label">Filter</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{sidebar}</div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Cari produk, brand, atau spec…"
                aria-label="Cari produk"
                className="h-10"
              />
            </div>

            <Select value={state.sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-10 w-[132px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => chip.remove(commit, state)}
                className="mono-label inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {chip.label}
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                </svg>
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="caption text-accent-text underline-offset-4 transition-colors hover:underline"
            >
              Reset
            </button>
          </div>
        ) : null}

        {results.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{ ...p, category_name: p.category_slug ? categoryName.get(p.category_slug) ?? null : null }}
                  showCompare
                  showQuoteCta
                  showBadge
                  sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 90vw"
                />
              ))}
            </div>

            {results.length > visible ? (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="mono-spec text-muted-foreground">
                  Menampilkan {shown.length} dari {results.length}
                </p>
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + BATCH)}
                  className="inline-flex h-11 items-center rounded-pill px-7 text-sm font-medium ring-1 ring-inset ring-border transition-colors hover:bg-card"
                >
                  Muat lebih banyak
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {results.length} produk ditemukan
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
      <div aria-hidden className="flex h-1 w-24 items-stretch gap-1">
        {[40, 12, 20, 8, 16].map((w, i) => (
          <span key={i} className="h-full rounded-full bg-border" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="heading-md mt-6">Tidak ada produk yang cocok</p>
      <p className="body-sm mt-2 max-w-[42ch] text-muted-foreground">
        Coba longgarkan filter, atau ceritakan kebutuhan Anda — kami bantu carikan konfigurasi yang tepat.
      </p>
      <div className="mt-5">
        <WhatsAppCTA context="general" label="Konsultasikan Kebutuhan" trackContext="catalog_empty" />
      </div>
    </div>
  );
}

type Chip = {
  id: string;
  label: string;
  remove: (commit: (s: FilterState) => void, state: FilterState) => void;
};

function buildChips(
  state: FilterState,
  labels: {
    categoryName: Map<string, string>;
    solutionName: (slug: string) => string;
    brandName: (slug: string) => string;
    specLabel: (key: string) => string;
    forcedCategory?: string;
  },
): Chip[] {
  const chips: Chip[] = [];
  if (state.category && state.category !== labels.forcedCategory) {
    chips.push({
      id: `cat`,
      label: labels.categoryName.get(state.category) ?? state.category,
      remove: (commit, s) => commit({ ...s, category: null }),
    });
  }
  for (const b of state.brands) {
    chips.push({
      id: `brand-${b}`,
      label: labels.brandName(b),
      remove: (commit, s) => commit({ ...s, brands: s.brands.filter((x) => x !== b) }),
    });
  }
  for (const sol of state.solutions) {
    chips.push({
      id: `sol-${sol}`,
      label: labels.solutionName(sol),
      remove: (commit, s) => commit({ ...s, solutions: s.solutions.filter((x) => x !== sol) }),
    });
  }
  for (const [key, tokens] of Object.entries(state.specs)) {
    for (const token of tokens) {
      chips.push({
        id: `spec-${key}-${token}`,
        label: `${labels.specLabel(key)}: ${token === "true" ? "Ya" : token.replace("-", "–")}`,
        remove: (commit, s) => {
          const next = (s.specs[key] ?? []).filter((t) => t !== token);
          const specs = { ...s.specs };
          if (next.length) specs[key] = next;
          else delete specs[key];
          commit({ ...s, specs });
        },
      });
    }
  }
  if (state.q.trim().length >= 2) {
    chips.push({
      id: `q`,
      label: `"${state.q.trim()}"`,
      remove: (commit, s) => commit({ ...s, q: "" }),
    });
  }
  return chips;
}
