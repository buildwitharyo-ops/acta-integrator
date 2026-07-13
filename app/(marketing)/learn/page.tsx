import type { Metadata } from "next";
import { ArticleHub, type HubConfig } from "@/components/article/ArticleHub";
import { NewsletterSignup } from "@/components/article/NewsletterSignup";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbNode } from "@/lib/jsonld";
import { getArticleCategories, getArticles, getFeaturedArticle } from "@/lib/queries/articles";
import { getPageSections } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

export const metadata: Metadata = buildMetadata({
  title: "Learn with ACTA — Belajar AV Tanpa Jargon Berlebihan | ACTA",
  description:
    "Panduan praktis dan edukasi seputar sistem audio visual — dari pemilihan perangkat hingga perancangan ruang.",
  path: "/learn",
});

export default async function LearnHubPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const activeTopic = sp.topic ?? null;
  const requestedPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [all, featured, categories, sections] = await Promise.all([
    getArticles("learn"),
    getFeaturedArticle("learn"),
    getArticleCategories("learn"),
    getPageSections("learn_hub"),
  ]);

  const intro = (sections["intro"] ?? {}) as { eyebrow?: string; headline?: string; subheadline?: string };
  const hasFeatured = Boolean(!activeTopic && featured);
  const showFeatured = hasFeatured && requestedPage === 1;

  let list = activeTopic ? all.filter((a) => a.category_slug === activeTopic) : all;
  if (hasFeatured && featured) list = list.filter((a) => a.id !== featured.id);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = list.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (activeTopic) params.set("topic", activeTopic);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/learn?${qs}` : "/learn";
  };

  const config: HubConfig = {
    type: "learn",
    eyebrow: intro.eyebrow ?? "LEARN WITH ACTA",
    headline: intro.headline ?? "Learn with ACTA",
    intro:
      intro.subheadline ??
      "Panduan praktis dan edukasi seputar sistem audio visual — dari pemilihan perangkat hingga perancangan ruang.",
    paramName: "topic",
    base: "/learn",
  };

  return (
    <>
      <JsonLd
        data={breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
        ])}
      />
      <ArticleHub
        config={config}
        featured={showFeatured ? featured : null}
        articles={pageItems}
        categories={categories.filter((c) => c.slug && c.name).map((c) => ({ slug: c.slug!, name: c.name! }))}
        activeCategory={activeTopic}
        page={page}
        totalPages={totalPages}
        makeHref={makeHref}
      />
      <NewsletterSignup />
    </>
  );
}
