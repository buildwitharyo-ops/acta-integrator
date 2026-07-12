import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const getPublishedProjects = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("v_projects").select("*").order("sort_order");
    return data ?? [];
  },
  ["projects-published"],
  { tags: ["page:home"] },
);

// "Contoh Implementasi" on product detail: published projects that include this product (06 §2.4).
export function getProjectsForProduct(productSlug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: product } = await supabase
        .from("v_products")
        .select("id")
        .eq("slug", productSlug)
        .maybeSingle();
      if (!product) return [];

      const { data: links } = await supabase
        .from("v_project_products")
        .select("project_id")
        .eq("product_id", product.id!);
      const ids = (links ?? []).map((l) => l.project_id);
      if (ids.length === 0) return [];

      const { data } = await supabase.from("v_projects").select("*").in("id", ids).order("sort_order");
      return data ?? [];
    },
    ["product-projects", productSlug],
    { tags: ["products", `product:${productSlug}`] },
  )();
}
