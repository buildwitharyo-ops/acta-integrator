import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared form dependencies (admin-verified by the calling page).
export async function getMediaForPicker() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("media")
    .select("id, storage_path, external_url, alt, is_placeholder")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProductOptions() {
  const sb = createAdminClient();
  const { data } = await sb.from("v_products").select("id, name, brand_name").order("name");
  return (data ?? [])
    .filter((p): p is { id: string; name: string | null; brand_name: string | null } => Boolean(p.id))
    .map((p) => ({ id: p.id, label: p.name ?? "", sublabel: p.brand_name ?? "" }));
}

export async function getSolutionOptions() {
  const sb = createAdminClient();
  const { data } = await sb.from("solutions").select("id, name, tier").order("tier").order("sort_order");
  return (data ?? []).map((s) => ({ id: s.id, label: s.name ?? "", sublabel: s.tier ?? "" }));
}

export async function getBrands() {
  const sb = createAdminClient();
  const { data } = await sb.from("brands").select("id, name").order("name");
  return (data ?? []).map((b) => ({ id: b.id, name: b.name }));
}

export async function getCategories() {
  const sb = createAdminClient();
  const { data } = await sb.from("product_categories").select("id, name, slug, sort_order").order("sort_order");
  return data ?? [];
}

export async function getSpecDefs() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("spec_definitions")
    .select("id, category_id, key, label, spec_group, data_type, unit, enum_options, sort_order")
    .eq("is_archived", false)
    .order("sort_order");
  return data ?? [];
}

export async function getAuthors() {
  const sb = createAdminClient();
  const { data } = await sb.from("authors").select("id, name, role").order("name");
  return (data ?? []).map((a) => ({ id: a.id, label: a.name, sublabel: a.role ?? "" }));
}

export async function getArticleCategoriesAll() {
  const sb = createAdminClient();
  const { data } = await sb.from("article_categories").select("id, type, name, slug").order("type").order("sort_order");
  return data ?? [];
}

// Admin-only aggregate reads (service-role; the panel layout has already verified an active admin).
export async function getDashboardData() {
  const sb = createAdminClient();

  const [{ data: products }, { data: articles }, { data: solutions }, { data: media }, { data: images }] =
    await Promise.all([
      sb.from("products").select("id, name, slug, status"),
      sb.from("articles").select("id, title, type, slug, status, scheduled_at"),
      sb.from("solutions").select("id, status"),
      sb.from("media").select("id, alt, is_placeholder"),
      sb.from("product_images").select("product_id, media_id"),
    ]);

  const productList = products ?? [];
  const articleList = articles ?? [];
  const mediaList = media ?? [];

  const productCounts = {
    published: productList.filter((p) => p.status === "published").length,
    draft: productList.filter((p) => p.status === "draft").length,
  };
  const articleCounts = {
    published: articleList.filter((a) => a.status === "published").length,
    draft: articleList.filter((a) => a.status === "draft").length,
    scheduled: articleList.filter((a) => a.status === "scheduled").length,
  };
  const solutionCount = (solutions ?? []).filter((s) => s.status === "published").length;

  // Attention: media without alt.
  const mediaNoAlt = mediaList.filter((m) => !m.alt || m.alt.trim() === "");

  // Attention: published products carrying a placeholder image.
  const placeholderMedia = new Set(mediaList.filter((m) => m.is_placeholder).map((m) => m.id));
  const productHasPlaceholder = new Map<string, boolean>();
  for (const img of images ?? []) {
    if (img.product_id && img.media_id && placeholderMedia.has(img.media_id)) {
      productHasPlaceholder.set(img.product_id, true);
    }
  }
  const placeholderProducts = productList.filter(
    (p) => p.status === "published" && p.id && productHasPlaceholder.get(p.id),
  );

  // Attention: scheduled articles past their scheduled_at.
  const now = new Date().toISOString();
  const scheduledOverdue = articleList.filter(
    (a) => a.status === "scheduled" && a.scheduled_at && a.scheduled_at < now,
  );

  return {
    counts: {
      products: productCounts,
      articles: articleCounts,
      solutions: solutionCount,
      media: mediaList.length,
    },
    attention: {
      placeholderProducts: placeholderProducts.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
      mediaNoAlt: mediaNoAlt.map((m) => ({ id: m.id })),
      mediaNoAltCount: mediaNoAlt.length,
      scheduledOverdue: scheduledOverdue.map((a) => ({ id: a.id, title: a.title, type: a.type })),
    },
  };
}
