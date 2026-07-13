import "server-only";
import { fetchAllRows } from "@/lib/admin/paginate";
import { createAdminClient } from "@/lib/supabase/admin";

export type MediaUsage = { where: string; label: string };

// Walk a page_sections content jsonb for any `_media_id`-suffixed string value (09 §4.2 convention).
function collectMediaIds(node: unknown, acc: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const x of node) collectMediaIds(x, acc);
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k.endsWith("_media_id") && typeof v === "string" && v) acc.add(v);
    else collectMediaIds(v, acc);
  }
}

// Reverse lookup over ALL media FK references + page_sections content. Returns a per-media-id map
// so the whole library grid can render "Dipakai di" and block deletes from one pass (08 §3.6).
export async function buildMediaUsageMap(): Promise<Record<string, MediaUsage[]>> {
  // Every read is paged (PostgREST max_rows=1000) and ordered by the unique PK `id` for a stable
  // total order — otherwise a still-used media beyond row 1000 would read as unused and be deletable.
  const sb = createAdminClient();
  const [productImages, products, articles, solutions, brands, authors, projects, projectImages, pages] = await Promise.all([
    fetchAllRows<{ media_id: string | null; product_id: string | null }>((f, t) => sb.from("product_images").select("id, media_id, product_id").range(f, t).order("id")),
    fetchAllRows<{ id: string; name: string }>((f, t) => sb.from("products").select("id, name").range(f, t).order("id")),
    fetchAllRows<{ title: string; cover_media_id: string | null }>((f, t) => sb.from("articles").select("id, title, cover_media_id").range(f, t).order("id")),
    fetchAllRows<{ name: string; hero_media_id: string | null }>((f, t) => sb.from("solutions").select("id, name, hero_media_id").range(f, t).order("id")),
    fetchAllRows<{ name: string; logo_media_id: string | null }>((f, t) => sb.from("brands").select("id, name, logo_media_id").range(f, t).order("id")),
    fetchAllRows<{ name: string; photo_media_id: string | null }>((f, t) => sb.from("authors").select("id, name, photo_media_id").range(f, t).order("id")),
    fetchAllRows<{ public_label: string; cover_media_id: string | null }>((f, t) => sb.from("projects").select("id, public_label, cover_media_id").range(f, t).order("id")),
    fetchAllRows<{ media_id: string | null; project_id: string | null }>((f, t) => sb.from("project_images").select("id, media_id, project_id").range(f, t).order("id")),
    fetchAllRows<{ page_key: string; section_key: string; content: unknown }>((f, t) => sb.from("page_sections").select("id, page_key, section_key, content").range(f, t).order("id")),
  ]);

  const productName = new Map(products.map((p) => [p.id, p.name]));
  const map: Record<string, MediaUsage[]> = {};
  const push = (id: string | null | undefined, u: MediaUsage) => {
    if (!id) return;
    (map[id] ??= []).push(u);
  };

  for (const r of productImages) push(r.media_id, { where: "Galeri produk", label: r.product_id ? productName.get(r.product_id) ?? "Produk" : "Produk" });
  for (const r of articles) push(r.cover_media_id, { where: "Cover artikel", label: r.title });
  for (const r of solutions) push(r.hero_media_id, { where: "Hero solusi", label: r.name });
  for (const r of brands) push(r.logo_media_id, { where: "Logo brand", label: r.name });
  for (const r of authors) push(r.photo_media_id, { where: "Foto author", label: r.name });
  for (const r of projects) push(r.cover_media_id, { where: "Cover proyek", label: r.public_label });
  for (const r of projectImages) push(r.media_id, { where: "Galeri proyek", label: "Proyek" });
  for (const row of pages) {
    const acc = new Set<string>();
    collectMediaIds(row.content, acc);
    for (const id of acc) push(id, { where: "Halaman", label: `${row.page_key}/${row.section_key}` });
  }
  return map;
}

export async function findMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  const map = await buildMediaUsageMap();
  return map[mediaId] ?? [];
}
