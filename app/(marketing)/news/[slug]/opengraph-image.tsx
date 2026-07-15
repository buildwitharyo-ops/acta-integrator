import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getArticleBySlug, getArticles } from "@/lib/queries/articles";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — News";

export async function generateStaticParams() {
  const articles = await getArticles("news");
  return articles.filter((a) => a.slug).map((a) => ({ slug: a.slug! }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug("news", slug);
  const heroUrl =
    article && !article.cover_is_placeholder
      ? mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext })
      : null;
  return renderOgImage({
    eyebrow: article?.category_name ? `News / ${article.category_name}` : "News",
    title: article?.seo_title ?? article?.title ?? "Artikel",
    subtitle: article?.excerpt ?? null,
    heroUrl,
  });
}
