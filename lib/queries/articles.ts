import "server-only";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

type ArticleType = "news" | "learn";

const ARTICLE_BASE_COLS =
  "id,type,slug,title,excerpt,is_featured,body,category_id,level,reading_time,author_id,tags,published_at,updated_at,cover_media_id,seo_title,seo_description";

export function getArticles(type: ArticleType) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", type)
        .order("published_at", { ascending: false });
      return data ?? [];
    },
    ["articles", type],
    { tags: [type] },
  )();
}

export function getFeaturedArticle(type: ArticleType) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", type)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    ["article-featured", type],
    { tags: [type] },
  )();
}

async function loadArticleDetailDraft(type: ArticleType, slug: string) {
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("articles")
    .select(ARTICLE_BASE_COLS)
    .eq("type", type)
    .eq("slug", slug)
    .maybeSingle();
  if (!a) return null;

  const [{ data: author }, { data: cat }, { data: cover }] = await Promise.all([
    admin.from("authors").select("name, role, photo_media_id").eq("id", a.author_id).maybeSingle(),
    a.category_id
      ? admin.from("article_categories").select("name, slug").eq("id", a.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    a.cover_media_id
      ? admin.from("media").select("storage_path, external_url, alt, caption, source_license, is_placeholder").eq("id", a.cover_media_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...a,
    author_name: author?.name ?? null,
    author_role: author?.role ?? null,
    author_photo_media_id: author?.photo_media_id ?? null,
    category_name: cat?.name ?? null,
    category_slug: cat?.slug ?? null,
    cover_image_path: cover?.storage_path ?? null,
    cover_image_url_ext: cover?.external_url ?? null,
    cover_image_alt: cover?.alt ?? null,
    cover_caption: cover?.caption ?? null,
    cover_credit: cover?.source_license ?? null,
    cover_is_placeholder: cover?.is_placeholder ?? null,
  };
}

export async function getArticleBySlug(type: ArticleType, slug: string, { preview = false } = {}) {
  if (preview) return loadArticleDetailDraft(type, slug);
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", type)
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
    ["article", type, slug],
    { tags: [type, `${type}:${slug}`] },
  )();
}

export async function getArticleBySlugOrNotFound(type: ArticleType, slug: string, opts?: { preview?: boolean }) {
  const article = await getArticleBySlug(type, slug, opts);
  if (!article) notFound();
  return article;
}

// Manual article_related, else fallback: same type, overlapping tags, newest (07 §4.6).
export function getRelatedArticles(type: ArticleType, slug: string, tags: string[]) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: self } = await supabase
        .from("v_articles")
        .select("id")
        .eq("type", type)
        .eq("slug", slug)
        .maybeSingle();
      if (!self) return [];

      const { data: manual } = await supabase
        .from("v_article_related")
        .select("related_article_id, sort_order")
        .eq("article_id", self.id!)
        .order("sort_order");

      if (manual && manual.length > 0) {
        const ids = manual.map((m) => m.related_article_id);
        const { data } = await supabase.from("v_articles").select("*").in("id", ids);
        const order = new Map(ids.map((id, i) => [id, i]));
        return (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }

      if (tags.length === 0) return [];
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .eq("type", type)
        .neq("id", self.id)
        .overlaps("tags", tags)
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
    ["article-related", type, slug],
    { tags: [type, `${type}:${slug}`] },
  )();
}

// Related articles for a product detail: tag overlap with [brand_slug, category_slug] (06 §2.5).
export function getRelatedArticlesForProduct(brandSlug: string, categorySlug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("v_articles")
        .select("*")
        .overlaps("tags", [brandSlug, categorySlug])
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
    ["product-articles", brandSlug, categorySlug],
    { tags: ["news", "learn"] },
  )();
}

// Homepage mixed feed: 3 newest, ensuring >=1 per type when available (09 §6).
export const getMixedArticleFeed = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: latest }, { data: topNews }, { data: topLearn }] = await Promise.all([
      supabase.from("v_articles").select("*").order("published_at", { ascending: false }).limit(3),
      supabase.from("v_articles").select("*").eq("type", "news").order("published_at", { ascending: false }).limit(1),
      supabase.from("v_articles").select("*").eq("type", "learn").order("published_at", { ascending: false }).limit(1),
    ]);

    const feed = [...(latest ?? [])];
    const ensure = (row: (typeof feed)[number] | null | undefined) => {
      if (!row) return;
      if (feed.some((a) => a.id === row.id)) return;
      if (!feed.some((a) => a.type === row.type)) feed.pop();
      feed.push(row);
    };
    ensure(topNews?.[0] ?? null);
    ensure(topLearn?.[0] ?? null);

    return feed
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, 3);
  },
  ["articles-mixed-feed"],
  { tags: ["news", "learn", "page:home"] },
);
