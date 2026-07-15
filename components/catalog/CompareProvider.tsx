"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export type CompareItem = {
  slug: string;
  name: string | null;
  brand_name: string | null;
  category_slug: string | null;
  category_name?: string | null;
  product_type_slug: string | null;
  product_type_name?: string | null;
  image: { storage_path: string | null; external_url: string | null } | null;
};

const STORAGE_KEY = "acta-compare";
export const COMPARE_MAX = 4;

type CompareContextValue = {
  items: CompareItem[];
  // Gated by CATEGORY, not product type — a category can span several product types with disjoint
  // spec fields (product_types migration, 2026-07-14), so the compare table renders an ADAPTIVE row
  // set (only fields every selected product actually has, see getCompareData) rather than a fixed
  // per-type template. That keeps Compare usable across a whole category even with few products
  // per exact type. category_slug is never null for a published product (unlike product_type_slug).
  activeCategory: string | null;
  add: (item: CompareItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  canAdd: (categorySlug: string | null) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, COMPARE_MAX));
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [items, hydrated]);

  const activeCategory = items[0]?.category_slug ?? null;

  const add = useCallback(
    (item: CompareItem) => {
      if (items.some((p) => p.slug === item.slug)) return;
      const anchor = items[0];
      if (anchor && item.category_slug !== anchor.category_slug) {
        toast(`Bandingkan hanya untuk produk sekategori (${anchor.category_name ?? anchor.category_slug})`);
        return;
      }
      if (items.length >= COMPARE_MAX) {
        toast(`Maksimal ${COMPARE_MAX} produk per perbandingan`);
        return;
      }
      trackEvent("compare_add", { product_slug: item.slug, count: items.length + 1, category: item.category_slug, product_type: item.product_type_slug });
      setItems((prev) => (prev.some((p) => p.slug === item.slug) ? prev : [...prev, item]));
    },
    [items],
  );

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((slug: string) => items.some((p) => p.slug === slug), [items]);

  const canAdd = useCallback(
    (categorySlug: string | null) => {
      if (items.length === 0) return true;
      if (items.length >= COMPARE_MAX) return false;
      return categorySlug != null && categorySlug === activeCategory;
    },
    [items, activeCategory],
  );

  const value = useMemo<CompareContextValue>(
    () => ({ items, activeCategory, add, remove, clear, has, canAdd }),
    [items, activeCategory, add, remove, clear, has, canAdd],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
