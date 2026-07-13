import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleDetail } from "@/components/article/ArticleDetail";
import { JsonLd } from "@/components/shared/JsonLd";
import { articleNode, breadcrumbNode } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";
import { getArticleBySlug, getArticleProducts, getArticles, getRelatedArticles } from "@/lib/queries/articles";
import { getRedirectDestination } from "@/lib/queries/redirects";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams() {
  const articles = await getArticles("learn");
  return articles.filter((a) => a.slug).map((a) => ({ slug: a.slug! }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  if (!article) return {};
  const og = article.cover_is_placeholder
    ? undefined
    : mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext }) ?? undefined;
  return buildMetadata({
    title: article.seo_title ?? `${article.title} | ACTA`,
    description: article.seo_description ?? article.excerpt ?? undefined,
    path: `/learn/${slug}`,
    ogImage: og,
  });
}

export default async function LearnArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);

  if (!article) {
    const dest = await getRedirectDestination(`/learn/${slug}`);
    if (dest) permanentRedirect(dest);
    notFound();
  }

  const [relatedProducts, relatedArticles] = await Promise.all([
    getArticleProducts("learn", slug),
    getRelatedArticles("learn", slug, article.tags ?? []),
  ]);

  const cover = mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext });
  const jsonLd = [
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Learn", path: "/learn" },
      { name: article.title ?? slug, path: `/learn/${slug}` },
    ]),
    articleNode({
      type: "learn",
      headline: article.title ?? slug,
      description: article.excerpt,
      image: article.cover_is_placeholder ? null : cover,
      datePublished: article.published_at,
      dateModified: article.updated_at,
      authorName: article.author_name,
      authorRole: article.author_role,
      path: `/learn/${slug}`,
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ArticleDetail article={article} relatedProducts={relatedProducts} relatedArticles={relatedArticles} />
    </>
  );
}
