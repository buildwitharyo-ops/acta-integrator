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

// Related products on solution detail: manual product_solutions order, else category fallback (keputusan #21).
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

      if (rel && rel.length > 0) {
        const ids = rel.map((r) => r.product_id);
        const { data } = await supabase.from("v_products").select("*").in("id", ids);
        const order = new Map(ids.map((id, i) => [id, i]));
        return (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }

      const categories = solution.related_category_slugs ?? [];
      if (categories.length === 0) return [];
      const { data } = await supabase
        .from("v_products")
        .select("*")
        .in("category_slug", categories)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
    ["solution-products", slug],
    { tags: ["solutions", `solution:${slug}`, "products"] },
  )();
}
