import type { Metadata } from "next";
import { ArticleHub, type HubConfig } from "@/components/article/ArticleHub";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbNode } from "@/lib/jsonld";
import { getArticleCategories, getArticles, getFeaturedArticle } from "@/lib/queries/articles";
import { getPageSections } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

export const metadata: Metadata = buildMetadata({
  title: "News — Kabar Industri AV & Teknologi | ACTA",
  description:
    "Perkembangan teknologi, produk, dan tren audio visual yang relevan untuk pemilik gedung dan fasilitas — dari ACTA.",
  path: "/news",
});

export default async function NewsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const activeCategory = sp.category ?? null;
  const requestedPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [all, featured, categories, sections] = await Promise.all([
    getArticles("news"),
    getFeaturedArticle("news"),
    getArticleCategories("news"),
    getPageSections("news_hub"),
  ]);

  const intro = (sections["intro"] ?? {}) as { eyebrow?: string; headline?: string; subheadline?: string };
  const hasFeatured = Boolean(!activeCategory && featured);
  const showFeatured = hasFeatured && requestedPage === 1;

  let list = activeCategory ? all.filter((a) => a.category_slug === activeCategory) : all;
  if (hasFeatured && featured) list = list.filter((a) => a.id !== featured.id);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = list.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/news?${qs}` : "/news";
  };

  const config: HubConfig = {
    type: "news",
    eyebrow: intro.eyebrow ?? "NEWS — AV & TECH INDUSTRY",
    headline: intro.headline ?? "AV Industry News & Trends",
    intro:
      intro.subheadline ??
      "Perkembangan teknologi, produk, dan tren audio visual yang relevan untuk pemilik gedung dan fasilitas.",
    paramName: "category",
    base: "/news",
  };

  return (
    <>
      <JsonLd
        data={breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
        ])}
      />
      <ArticleHub
        config={config}
        featured={showFeatured ? featured : null}
        articles={pageItems}
        categories={categories.filter((c) => c.slug && c.name).map((c) => ({ slug: c.slug!, name: c.name! }))}
        activeCategory={activeCategory}
        page={page}
        totalPages={totalPages}
        makeHref={makeHref}
      />
    </>
  );
}
