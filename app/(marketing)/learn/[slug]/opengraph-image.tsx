import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getArticleBySlug } from "@/lib/queries/articles";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Learn";

// NO `generateStaticParams` here — deliberately (03-UI §14.1).
//
// This is the highest-leverage build-time change available in the section. A
// Satori render plus an Resvg encode costs ~300–600 ms per image, before the
// cover fetch; multiplied across every published lesson that is minutes of every
// build spent against Vercel's 45-minute ceiling, producing images a social
// crawler requests once and mostly never requests at all.
//
// Without a prerender set the route renders on demand and the result is cached at
// the CDN, so the first crawler pays once and every subsequent request is a cache
// hit. The lesson PAGE keeps its `generateStaticParams`; only the image is
// deferred. The ~10 static hub OG images keep theirs.

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
