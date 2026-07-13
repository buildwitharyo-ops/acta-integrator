import "server-only";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

// Explicit public columns for draft reads off the base table — never internal_price.
const PRODUCT_BASE_COLS =
  "id,name,slug,brand_id,category_id,short_spec,description_md,suitable_for,spec_source_url,is_featured,seo_title,seo_description,created_at,updated_at";

export const getProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("v_products")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["products-list"],
  { tags: ["products"] },
);

export const getFeaturedProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("v_products")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(4);
    return data ?? [];
  },
  ["products-featured"],
  { tags: ["products"] },
);

export const getCatalogTeaserProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data: products } = await supabase
      .from("v_products")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(4);
    if (!products?.length) return [];

    const ids = products.map((p) => p.id!);
    const { data: images } = await supabase
      .from("v_product_images")
      .select("product_id, sort_order, external_url, storage_path")
      .in("product_id", ids)
      .order("sort_order");

    type ImageRow = NonNullable<typeof images>[number];
    const firstImage = new Map<string, ImageRow>();
    for (const img of images ?? []) {
      if (img.product_id && !firstImage.has(img.product_id)) firstImage.set(img.product_id, img);
    }

    return products.map((p) => ({ ...p, image: firstImage.get(p.id!) ?? null }));
  },
  ["catalog-teaser-products"],
  { tags: ["products"] },
);

export const getMenuFeaturedProduct = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data: settings } = await supabase
      .from("v_site_settings")
      .select("featured_product_id")
      .maybeSingle();
    if (!settings?.featured_product_id) return null;

    const { data: product } = await supabase
      .from("v_products")
      .select("*")
      .eq("id", settings.featured_product_id)
      .maybeSingle();
    if (!product) return null;

    const { data: image } = await supabase
      .from("v_product_images")
      .select("*")
      .eq("product_id", product.id!)
      .order("sort_order")
      .limit(1)
      .maybeSingle();

    return { ...product, image };
  },
  ["menu-featured-product"],
  { tags: ["products", "settings"] },
);

export const getProductCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("v_product_categories").select("*").order("sort_order");
    return data ?? [];
  },
  ["product-categories"],
  { tags: ["products"] },
);

// Each category with its product count + one representative image (featured first, else newest).
// Drives the Products mega-menu hover preview and the homepage catalog carousel.
export const getCategoryPreviews = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: cats }, { data: products }] = await Promise.all([
      supabase.from("v_product_categories").select("id, name, slug, description").order("sort_order"),
      supabase
        .from("v_products")
        .select("id, category_slug, is_featured, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const count = new Map<string, number>();
    for (const p of products ?? []) {
      if (p.category_slug) count.set(p.category_slug, (count.get(p.category_slug) ?? 0) + 1);
    }

    const productIds = (products ?? []).map((p) => p.id).filter((id): id is string => Boolean(id));
    const { data: images } = productIds.length
      ? await supabase
          .from("v_product_images")
          .select("product_id, sort_order, storage_path, external_url")
          .in("product_id", productIds)
          .order("sort_order")
      : { data: [] };

    const firstImage = new Map<string, { storage_path: string | null; external_url: string | null }>();
    for (const img of images ?? []) {
      if (img.product_id && !firstImage.has(img.product_id)) {
        firstImage.set(img.product_id, { storage_path: img.storage_path, external_url: img.external_url });
      }
    }

    // Representative image = first product (featured, then newest) in the category that actually has one.
    const catImage = new Map<string, { storage_path: string | null; external_url: string | null }>();
    for (const p of [...(products ?? [])].sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured))) {
      if (!p.category_slug || catImage.has(p.category_slug)) continue;
      const img = p.id ? firstImage.get(p.id) : undefined;
      if (img) catImage.set(p.category_slug, img);
    }

    return (cats ?? []).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: c.slug ? count.get(c.slug) ?? 0 : 0,
      image: c.slug ? catImage.get(c.slug) ?? null : null,
    }));
  },
  ["category-previews"],
  { tags: ["products"] },
);

export type CatalogSpecValue = {
  key: string | null;
  label: string | null;
  spec_group: string | null;
  data_type: string | null;
  unit: string | null;
  is_filterable: boolean | null;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_options: string[] | null;
};

// Full published catalog as ONE cached SSG dataset — the client grid filters/searches over this (06 §1.3, 09 §0 #12).
export const getCatalogProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data: products } = await supabase
      .from("v_products")
      .select("id,name,slug,brand_name,brand_slug,category_slug,short_spec,is_featured,created_at")
      .order("created_at", { ascending: false });
    if (!products?.length) return [];

    const ids = products.map((p) => p.id).filter((id): id is string => Boolean(id));
    const [{ data: images }, { data: links }, { data: specVals }] = await Promise.all([
      supabase
        .from("v_product_images")
        .select("product_id, sort_order, storage_path, external_url")
        .in("product_id", ids)
        .order("sort_order"),
      supabase.from("v_product_solutions").select("product_id, solution_id").in("product_id", ids),
      supabase
        .from("v_product_spec_values")
        .select("product_id, key, label, spec_group, data_type, unit, is_filterable, value_text, value_number, value_boolean, value_options")
        .in("product_id", ids),
    ]);

    const firstImage = new Map<string, { storage_path: string | null; external_url: string | null }>();
    for (const img of images ?? []) {
      if (img.product_id && !firstImage.has(img.product_id)) {
        firstImage.set(img.product_id, { storage_path: img.storage_path, external_url: img.external_url });
      }
    }
    const solByProduct = new Map<string, string[]>();
    for (const l of links ?? []) {
      if (l.product_id && l.solution_id) {
        const arr = solByProduct.get(l.product_id) ?? [];
        arr.push(l.solution_id);
        solByProduct.set(l.product_id, arr);
      }
    }
    const specByProduct = new Map<string, CatalogSpecValue[]>();
    for (const s of specVals ?? []) {
      if (!s.product_id) continue;
      const arr = specByProduct.get(s.product_id) ?? [];
      arr.push(s as CatalogSpecValue);
      specByProduct.set(s.product_id, arr);
    }

    return products.map((p) => ({
      ...p,
      image: p.id ? firstImage.get(p.id) ?? null : null,
      solution_ids: p.id ? solByProduct.get(p.id) ?? [] : [],
      specs: p.id ? specByProduct.get(p.id) ?? [] : [],
    }));
  },
  ["catalog-products"],
  { tags: ["products"] },
);

export type CatalogProduct = Awaited<ReturnType<typeof getCatalogProducts>>[number];

// Spec definitions with resolved category_slug — drives dynamic per-category filters (06 §1.2) + compare rows.
export const getSpecDefinitions = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: defs }, { data: cats }] = await Promise.all([
      supabase.from("v_spec_definitions").select("*").order("sort_order"),
      supabase.from("v_product_categories").select("id, slug"),
    ]);
    const catSlug = new Map((cats ?? []).map((c) => [c.id, c.slug]));
    return (defs ?? []).map((d) => ({
      ...d,
      category_slug: d.category_id ? catSlug.get(d.category_id) ?? null : null,
    }));
  },
  ["spec-definitions"],
  { tags: ["products"] },
);

export type SpecDefinition = Awaited<ReturnType<typeof getSpecDefinitions>>[number];

// Compare dataset: requested products (by slug) with per-key spec values + comparable defs per category (06 §3).
export function getCompareData(slugs: string[]) {
  const key = [...slugs].sort().join(",");
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: products } = await supabase.from("v_products").select("*").in("slug", slugs);
      if (!products?.length) return { products: [], specDefsByCategory: {} as Record<string, SpecDefinition[]> };

      const ids = products.map((p) => p.id).filter((id): id is string => Boolean(id));
      const catSlugs = [...new Set(products.map((p) => p.category_slug).filter((s): s is string => Boolean(s)))];

      const [{ data: images }, { data: specVals }, { data: cats }] = await Promise.all([
        supabase
          .from("v_product_images")
          .select("product_id, sort_order, storage_path, external_url")
          .in("product_id", ids)
          .order("sort_order"),
        supabase.from("v_product_spec_values").select("*").in("product_id", ids),
        supabase.from("v_product_categories").select("id, slug, name").in("slug", catSlugs),
      ]);

      const catIds = (cats ?? []).map((c) => c.id).filter((id): id is string => Boolean(id));
      const { data: defs } = catIds.length
        ? await supabase.from("v_spec_definitions").select("*").in("category_id", catIds).order("sort_order")
        : { data: [] };

      const idToSlug = new Map((cats ?? []).map((c) => [c.id, c.slug]));
      const nameBySlug = new Map((cats ?? []).map((c) => [c.slug, c.name]));

      const specDefsByCategory: Record<string, SpecDefinition[]> = {};
      for (const d of defs ?? []) {
        const slug = d.category_id ? idToSlug.get(d.category_id) : null;
        if (!slug) continue;
        (specDefsByCategory[slug] ??= []).push({ ...d, category_slug: slug } as SpecDefinition);
      }

      const firstImage = new Map<string, { storage_path: string | null; external_url: string | null }>();
      for (const img of images ?? []) {
        if (img.product_id && !firstImage.has(img.product_id)) {
          firstImage.set(img.product_id, { storage_path: img.storage_path, external_url: img.external_url });
        }
      }
      const specByProduct = new Map<string, Record<string, CatalogSpecValue>>();
      for (const s of specVals ?? []) {
        if (!s.product_id || !s.key) continue;
        const rec = specByProduct.get(s.product_id) ?? {};
        rec[s.key] = s as CatalogSpecValue;
        specByProduct.set(s.product_id, rec);
      }

      const shaped = products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand_name: p.brand_name,
        short_spec: p.short_spec,
        category_slug: p.category_slug,
        category_name: p.category_slug ? nameBySlug.get(p.category_slug) ?? null : null,
        image: p.id ? firstImage.get(p.id) ?? null : null,
        specValues: (p.id ? specByProduct.get(p.id) : null) ?? ({} as Record<string, CatalogSpecValue>),
      }));

      return { products: shaped, specDefsByCategory };
    },
    ["compare", key],
    { tags: ["products"] },
  )();
}

export type CompareData = Awaited<ReturnType<typeof getCompareData>>;
export type CompareProduct = CompareData["products"][number];

// Published projects (with a photo) that use this product — "Contoh Implementasi" (06 §2.4). Client names never exposed.
export function getProductImplementation(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: base } = await supabase.from("v_products").select("id").eq("slug", slug).maybeSingle();
      if (!base) return [];

      const { data: links } = await supabase
        .from("v_project_products")
        .select("project_id")
        .eq("product_id", base.id!);
      const projectIds = (links ?? []).map((l) => l.project_id).filter((id): id is string => Boolean(id));
      if (!projectIds.length) return [];

      const { data: projects } = await supabase
        .from("v_projects")
        .select("*")
        .in("id", projectIds)
        .order("sort_order");
      return (projects ?? []).filter((p) => p.cover_image_path || p.cover_image_url_ext);
    },
    ["product-implementation", slug],
    { tags: ["products", `product:${slug}`] },
  )();
}

async function loadProductDetail(slug: string) {
  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from("v_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!product) return null;

  const [{ data: specs }, { data: images }] = await Promise.all([
    supabase.from("v_product_spec_values").select("*").eq("product_id", product.id!).order("sort_order"),
    supabase.from("v_product_images").select("*").eq("product_id", product.id!).order("sort_order"),
  ]);

  return { ...product, specs: specs ?? [], images: images ?? [] };
}

async function loadProductDetailDraft(slug: string) {
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("products")
    .select(PRODUCT_BASE_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return null;

  const [{ data: brand }, { data: cat }, { data: specs }, { data: images }] = await Promise.all([
    admin.from("brands").select("name, slug").eq("id", p.brand_id).maybeSingle(),
    admin.from("product_categories").select("slug").eq("id", p.category_id).maybeSingle(),
    admin
      .from("product_spec_values")
      .select("product_id, spec_definition_id, value_text, value_number, value_boolean, value_options")
      .eq("product_id", p.id),
    admin
      .from("product_images")
      .select("product_id, media_id, sort_order, image_annotation")
      .eq("product_id", p.id)
      .order("sort_order"),
  ]);

  return {
    ...p,
    brand_name: brand?.name ?? null,
    brand_slug: brand?.slug ?? null,
    category_slug: cat?.slug ?? null,
    specs: specs ?? [],
    images: images ?? [],
  };
}

export async function getProductBySlug(slug: string, { preview = false } = {}) {
  if (preview) return loadProductDetailDraft(slug);
  return unstable_cache(() => loadProductDetail(slug), ["product", slug], {
    tags: ["products", `product:${slug}`],
  })();
}

// Published-only detail (single concrete shape) for the SSG render — draft preview uses getProductBySlug (Fase 10).
export function getPublishedProductDetail(slug: string) {
  return unstable_cache(() => loadProductDetail(slug), ["product", slug], {
    tags: ["products", `product:${slug}`],
  })();
}

export async function getProductBySlugOrNotFound(slug: string, opts?: { preview?: boolean }) {
  const product = await getProductBySlug(slug, opts);
  if (!product) notFound();
  return product;
}

// Manual "Unit Serupa" override, else fallback: same category, most product_solutions overlap, newest (06 §2.5).
export function getSimilarProducts(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: base } = await supabase
        .from("v_products")
        .select("id, category_slug")
        .eq("slug", slug)
        .maybeSingle();
      if (!base) return [];

      const { data: manual } = await supabase
        .from("v_product_similar")
        .select("similar_product_id, sort_order")
        .eq("product_id", base.id!)
        .order("sort_order");

      let result: Awaited<ReturnType<typeof getProducts>> = [];

      if (manual && manual.length > 0) {
        const ids = manual.map((m) => m.similar_product_id);
        const { data } = await supabase.from("v_products").select("*").in("id", ids);
        const order = new Map(ids.map((id, i) => [id, i]));
        result = (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, 4);
      } else {
        // Fallback: same category, ranked by product_solutions overlap with the base, then newest.
        const { data: baseLinks } = await supabase
          .from("v_product_solutions")
          .select("solution_id")
          .eq("product_id", base.id!);
        const baseSolutions = new Set((baseLinks ?? []).map((l) => l.solution_id));

        const { data: candidates } = await supabase
          .from("v_products")
          .select("*")
          .eq("category_slug", base.category_slug!)
          .neq("id", base.id!);
        if (!candidates || candidates.length === 0) return [];

        const { data: candLinks } = await supabase
          .from("v_product_solutions")
          .select("product_id, solution_id")
          .in("product_id", candidates.map((c) => c.id!));
        const overlap = new Map<string, number>();
        for (const link of candLinks ?? []) {
          if (link.product_id && baseSolutions.has(link.solution_id)) {
            overlap.set(link.product_id, (overlap.get(link.product_id) ?? 0) + 1);
          }
        }

        result = candidates
          .sort((a, b) => {
            const byOverlap = (overlap.get(b.id!) ?? 0) - (overlap.get(a.id!) ?? 0);
            if (byOverlap !== 0) return byOverlap;
            return (b.created_at ?? "").localeCompare(a.created_at ?? "");
          })
          .slice(0, 4);
      }

      const ids = result.map((p) => p.id).filter((id): id is string => Boolean(id));
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

      return result.map((p) => ({ ...p, image: p.id ? firstImage.get(p.id) ?? null : null }));
    },
    ["product-similar", slug],
    { tags: ["products", `product:${slug}`] },
  )();
}
