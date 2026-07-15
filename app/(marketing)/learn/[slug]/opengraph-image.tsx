import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getArticleBySlug, getArticles } from "@/lib/queries/articles";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Learn";

export async function generateStaticParams() {
  const articles = await getArticles("learn");
  return articles.filter((a) => a.slug).map((a) => ({ slug: a.slug! }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  const heroUrl =
    article && !article.cover_is_placeholder
      ? mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext })
      : null;
  return renderOgImage({
    eyebrow: article?.category_name ? `Learn / ${article.category_name}` : "Learn",
    title: article?.seo_title ?? article?.title ?? "Panduan",
    subtitle: article?.excerpt ?? null,
    heroUrl,
  });
}
