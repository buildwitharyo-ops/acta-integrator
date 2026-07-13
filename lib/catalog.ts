import type { CatalogProduct, SpecDefinition } from "@/lib/queries/products";

export type SortKey = "newest" | "brand" | "name";

export type FilterState = {
  category: string | null;
  brands: string[];
  solutions: string[]; // solution slugs
  specs: Record<string, string[]>; // spec key -> selected tokens
  q: string;
  sort: SortKey;
};

export const EMPTY_FILTERS: FilterState = {
  category: null,
  brands: [],
  solutions: [],
  specs: {},
  q: "",
  sort: "newest",
};

const RESERVED = new Set(["category", "brand", "solution", "q", "sort"]);
const SORTS: SortKey[] = ["newest", "brand", "name"];

export function parseFilters(params: URLSearchParams, specKeys: Set<string>): FilterState {
  const list = (v: string | null) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
  const sortParam = params.get("sort");
  const specs: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (RESERVED.has(key)) continue;
    if (specKeys.has(key)) specs[key] = value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return {
    category: params.get("category") || null,
    brands: list(params.get("brand")),
    solutions: list(params.get("solution")),
    specs,
    q: params.get("q") ?? "",
    sort: SORTS.includes(sortParam as SortKey) ? (sortParam as SortKey) : "newest",
  };
}

export function buildQuery(state: FilterState): string {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.brands.length) p.set("brand", state.brands.join(","));
  if (state.solutions.length) p.set("solution", state.solutions.join(","));
  for (const [key, tokens] of Object.entries(state.specs)) {
    if (tokens.length) p.set(key, tokens.join(","));
  }
  if (state.q.trim().length >= 2) p.set("q", state.q.trim());
  if (state.sort !== "newest") p.set("sort", state.sort);
  return p.toString();
}

export function hasActiveFilters(state: FilterState): boolean {
  return Boolean(
    state.category ||
      state.brands.length ||
      state.solutions.length ||
      Object.values(state.specs).some((t) => t.length) ||
      state.q.trim().length >= 2,
  );
}

export type Bucket = { token: string; label: string; min: number; max: number };

// Split a numeric spec's observed values into up to `n` contiguous buckets.
export function numericBuckets(values: number[], unit: string | null, n = 4): Bucket[] {
  const nums = [...new Set(values.filter((v) => Number.isFinite(v)))].sort((a, b) => a - b);
  if (nums.length < 2) return [];
  const min = nums[0]!;
  const max = nums[nums.length - 1]!;
  if (min === max) return [];
  const steps = Math.min(n, nums.length);
  const size = (max - min) / steps;
  const fmt = (v: number) => {
    const r = Math.round(v * 100) / 100;
    return Number.isInteger(r) ? String(r) : String(r);
  };
  const u = unit ? ` ${unit}` : "";
  const out: Bucket[] = [];
  for (let i = 0; i < steps; i++) {
    const lo = min + size * i;
    const hi = i === steps - 1 ? max : min + size * (i + 1);
    out.push({ token: `${fmt(lo)}-${fmt(hi)}`, label: `${fmt(lo)}–${fmt(hi)}${u}`, min: lo, max: hi });
  }
  return out;
}

function valueForKey(product: CatalogProduct, key: string) {
  return product.specs.find((s) => s.key === key);
}

function matchesSpec(product: CatalogProduct, key: string, tokens: string[], def?: SpecDefinition): boolean {
  const sv = valueForKey(product, key);
  if (!sv) return false;
  const dataType = def?.data_type ?? sv.data_type;
  if (dataType === "number") {
    if (sv.value_number == null) return false;
    return tokens.some((tok) => {
      const [lo, hi] = tok.split("-").map(Number);
      if (lo == null || hi == null || Number.isNaN(lo) || Number.isNaN(hi)) return false;
      // inclusive on both ends so the top bucket captures the max value
      return sv.value_number! >= lo && sv.value_number! <= hi;
    });
  }
  if (dataType === "boolean") {
    return tokens.includes("true") ? sv.value_boolean === true : true;
  }
  // enum / text: match against value_options or value_text
  const opts = (sv.value_options ?? []).map((o) => o.toLowerCase());
  const text = (sv.value_text ?? "").toLowerCase();
  return tokens.some((t) => {
    const tl = t.toLowerCase();
    return opts.includes(tl) || text === tl;
  });
}

function matchesSearch(product: CatalogProduct, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return true;
  const hay = [
    product.name,
    product.brand_name,
    product.short_spec,
    ...product.specs.map((s) => s.value_text ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function applyFilters(
  products: CatalogProduct[],
  state: FilterState,
  opts: { solutionSlugToId: Map<string, string>; specDefsByKey: Map<string, SpecDefinition> },
): CatalogProduct[] {
  const wantSolIds = state.solutions
    .map((slug) => opts.solutionSlugToId.get(slug))
    .filter((id): id is string => Boolean(id));

  const filtered = products.filter((p) => {
    if (state.category && p.category_slug !== state.category) return false;
    if (state.brands.length && !(p.brand_slug && state.brands.includes(p.brand_slug))) return false;
    if (wantSolIds.length && !wantSolIds.some((id) => p.solution_ids.includes(id))) return false;
    for (const [key, tokens] of Object.entries(state.specs)) {
      if (tokens.length && !matchesSpec(p, key, tokens, opts.specDefsByKey.get(key))) return false;
    }
    if (!matchesSearch(p, state.q)) return false;
    return true;
  });

  const sorted = [...filtered];
  if (state.sort === "brand") {
    sorted.sort((a, b) => (a.brand_name ?? "").localeCompare(b.brand_name ?? "") || (a.name ?? "").localeCompare(b.name ?? ""));
  } else if (state.sort === "name") {
    sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  } else {
    sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }
  return sorted;
}
