import "server-only";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

const SOLUTION_BASE_COLS =
  "id,slug,name,tier,value_prop,hero_headline,hero_subcopy,hero_media_id,hero_annotations,signal_chain,related_category_slugs,tags,wa_message,seo_title,seo_description,sort_order,updated_at";

// Core before supporting (enum order), then sort_order.
export const getSolutions = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("v_solutions")
      .select("*")
      .order("tier")
      .order("sort_order");
    return data ?? [];
  },
  ["solutions-list"],
  { tags: ["solutions"] },
);

async function loadSolutionDetail(slug: string) {
  const supabase = createPublicClient();
  const { data: solution } = await supabase
    .from("v_solutions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!solution) return null;

  const { data: sections } = await supabase
    .from("v_solution_sections")
    .select("*")
    .eq("solution_id", solution.id!)
    .order("sort_order");

  return { ...solution, sections: sections ?? [] };
}

async function loadSolutionDetailDraft(slug: string) {
  const admin = createAdminClient();
  const { data: s } = await admin
    .from("solutions")
    .select(SOLUTION_BASE_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (!s) return null;

  const [{ data: media }, { data: sections }] = await Promise.all([
    s.hero_media_id
      ? admin.from("media").select("storage_path, external_url, alt, is_placeholder").eq("id", s.hero_media_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("solution_sections")
      .select("solution_id, type, heading, body, items, sort_order")
      .eq("solution_id", s.id)
      .order("sort_order"),
  ]);

  return {
    ...s,
    hero_image_path: media?.storage_path ?? null,
    hero_image_url_ext: media?.external_url ?? null,
    hero_image_alt: media?.alt ?? null,
    hero_is_placeholder: media?.is_placeholder ?? null,
    sections: sections ?? [],
  };
}

export async function getSolutionBySlug(slug: string, { preview = false } = {}) {
  if (preview) return loadSolutionDetailDraft(slug);
  return unstable_cache(() => loadSolutionDetail(slug), ["solution", slug], {
    tags: ["solutions", `solution:${slug}`],
  })();
}

export async function getSolutionBySlugOrNotFound(slug: string, opts?: { preview?: boolean }) {
  const solution = await getSolutionBySlug(slug, opts);
  if (!solution) notFound();
  return solution;
}

// Solutions relevant to a product category — category landing internal linking (03 §6.2).
export function getSolutionsForCategory(categorySlug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_solutions")
        .select("slug, name, tier, value_prop")
        .contains("related_category_slugs", [categorySlug])
        .order("tier")
        .order("sort_order");
      return data ?? [];
    },
    ["category-solutions", categorySlug],
    { tags: ["solutions", "products"] },
  )();
}

// Related products on solution detail: manual product_solutions order, else category fallback (keputusan #21).
// Attaches the first product image (public columns only — never internal_price).
export function getSolutionProducts(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: solution } = await supabase
        .from("v_solutions")
        .select("id, related_category_slugs")
        .eq("slug", slug)
        .maybeSingle();
      if (!solution) return [];

      const { data: rel } = await supabase
        .from("v_product_solutions")
        .select("product_id, sort_order")
        .eq("solution_id", solution.id!)
        .order("sort_order");

      let products: Awaited<ReturnType<typeof loadByIds>> = [];
      async function loadByIds(ids: string[]) {
        const { data } = await supabase.from("v_products").select("*").in("id", ids);
        const order = new Map(ids.map((id, i) => [id, i]));
        return (data ?? []).sort((a, b) => (order.get(a.id ?? "") ?? 0) - (order.get(b.id ?? "") ?? 0));
      }

      if (rel && rel.length > 0) {
        const relIds = rel.map((r) => r.product_id).filter((id): id is string => Boolean(id));
        products = await loadByIds(relIds);
      } else {
        const categories = solution.related_category_slugs ?? [];
        if (categories.length === 0) return [];
        const { data } = await supabase
          .from("v_products")
          .select("*")
          .in("category_slug", categories)
          .order("created_at", { ascending: false })
          .limit(4);
        products = data ?? [];
      }

      products = products.slice(0, 4);
      const ids = products.map((p) => p.id).filter((id): id is string => Boolean(id));
      const { data: images } = ids.length
        ? await supabase
            .from("v_product_images")
            .select("product_id, sort_order, storage_path, external_url")
            .in("product_id", ids)
            .order("sort_order")
        : { data: [] };
      const firstImage = new Map<string, { storage_path: string | null; external_url: string | null }>();
      for (const img of images ?? []) {
        if (img.product_id && !firstImage.has(img.product_id)) {
          firstImage.set(img.product_id, { storage_path: img.storage_path, external_url: img.external_url });
        }
      }

      return products.map((p) => ({ ...p, image: p.id ? firstImage.get(p.id) ?? null : null }));
    },
    ["solution-products", slug],
    { tags: ["solutions", `solution:${slug}`, "products"] },
  )();
}
