import "server-only";
import { fetchAllRows } from "@/lib/admin/paginate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedRow } from "@/lib/catalog-pipeline/parser";

// Deterministic dedupe — never delegated to AI judgment (PRD §6). Normalizes brand+model the same
// way the manual seeding pipeline did (strip diacritics/punctuation, uppercase) so "Martin Audio
// V.10" and "Martin Audio V10" collapse to the same key.
function norm(s: string): string {
  return s
    .normalize("NFKD")
    .toUpperCase()
    .replace(/\+/g, "PLUS")
    .replace(/[^A-Z0-9]/g, "");
}

function key(brand: string, model: string): string {
  return norm(`${brand}${model}`);
}

type ExistingProduct = { id: string; name: string; brandName: string | null };

// products can exceed 1000 rows — always paginate via fetchAllRows (PRD §7.4 / the real bug hit
// during manual seeding this session).
async function selectAllProducts(): Promise<ExistingProduct[]> {
  const sb = createAdminClient();
  type Raw = { id: string; name: string; brands: { name: string } | { name: string }[] | null };
  const rows = await fetchAllRows<Raw>((from, to) =>
    sb.from("products").select("id, name, brands(name)").range(from, to),
  );
  return rows.map((p) => {
    const brand = p.brands;
    const brandName = Array.isArray(brand) ? (brand[0]?.name ?? null) : (brand?.name ?? null);
    return { id: p.id, name: p.name, brandName };
  });
}

export type DedupedRow = ParsedRow & {
  dedupeStatus: "new" | "dup_in_sheet" | "dup_in_db";
  matchedProductId: string | null;
};

export async function dedupeRows(rows: ParsedRow[]): Promise<DedupedRow[]> {
  const existing = await selectAllProducts();
  const dbIndex = new Map<string, string>(); // normalized brand+model -> product id
  for (const p of existing) {
    if (p.brandName) dbIndex.set(key(p.brandName, p.name), p.id);
    dbIndex.set(norm(p.name), p.id); // fallback: model alone sometimes embeds the brand already
  }

  const seenInSheet = new Set<string>();
  return rows.map((row) => {
    const k = key(row.brand, row.model);
    if (seenInSheet.has(k)) {
      return { ...row, dedupeStatus: "dup_in_sheet" as const, matchedProductId: null };
    }
    seenInSheet.add(k);

    const matchId = dbIndex.get(k) ?? dbIndex.get(norm(`${row.brand}${row.model}`));
    if (matchId) {
      return { ...row, dedupeStatus: "dup_in_db" as const, matchedProductId: matchId };
    }
    return { ...row, dedupeStatus: "new" as const, matchedProductId: null };
  });
}
