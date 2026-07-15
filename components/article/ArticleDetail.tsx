import Image from "next/image";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";
import { collectHeadings, formatArticleDate, isRecentlyUpdated } from "@/lib/article";
import { mediaUrl } from "@/lib/media";
import { ArticleBody } from "./ArticleBody";
import { ArticleHubCard, LevelBadge, type ArticleCardRow } from "./ArticleHubCard";
import { ArticleShare } from "./ArticleShare";
import { ArticleToc } from "./ArticleToc";

export type ArticleDetailData = {
  type: string | null;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  body: unknown;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  cover_image_alt: string | null;
  cover_caption: string | null;
  cover_credit: string | null;
  category_name: string | null;
  category_slug: string | null;
  level: string | null;
  reading_time: number | null;
  published_at: string | null;
  updated_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

function AuthorByline({ name, role }: { name: string | null; role: string | null }) {
  if (!name) return null;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <span className="mono-label flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
        {initials}
      </span>
      <div>
        <p className="body-sm font-medium text-foreground">{name}</p>
        {role ? <p className="caption text-muted-foreground">{role} · ACTA</p> : null}
      </div>
    </div>
  );
}

export function ArticleDetail({
  article,
  relatedProducts,
  relatedArticles,
}: {
  article: ArticleDetailData;
  relatedProducts: ProductCardData[];
  relatedArticles: ArticleCardRow[];
}) {
  const isLearn = article.type === "learn";
  const base = isLearn ? "/learn" : "/news";
  const cover = mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext });
  const updated = isRecentlyUpdated(article.published_at, article.updated_at);

  const headings = collectHeadings(article.body);
  const tocHeadings = headings.filter((h) => h.level === 2);
  const hasToc = isLearn && tocHeadings.length >= 3;

  const metaParts = isLearn
    ? [
        article.category_name?.toUpperCase(),
        article.level ? article.level.toUpperCase() : null,
        article.reading_time ? `${article.reading_time} MENIT BACA` : null,
        updated ? `DIPERBARUI ${formatArticleDate(article.updated_at).toUpperCase()}` : null,
      ]
    : [
        formatArticleDate(article.published_at).toUpperCase(),
        article.category_name?.toUpperCase(),
        article.reading_time ? `${article.reading_time} MENIT` : null,
      ];

  const waMessage = `Halo ACTA, saya baru membaca "${article.title}" dan ingin berdiskusi soal kebutuhan ruang kami.`;

  const bodyContent = (
    <>
      <ArticleBody doc={article.body} />

      <div className="mt-12">
        <MeterDivider className="mb-6" />
        <ArticleShare title={article.title ?? "Artikel ACTA"} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="heading-md">Butuh diskusi untuk kebutuhan ruang Anda?</p>
        <p className="body-sm mt-1.5 text-muted-foreground">
          Ceritakan konteksnya — tim engineering ACTA bantu petakan sistem yang tepat.
        </p>
        <div className="mt-4">
          <WhatsAppCTA context="general" message={waMessage} label="Konsultasi via WhatsApp" trackContext="article" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <article className="container py-section">
        <Breadcrumb
          items={[
            { name: isLearn ? "Learn" : "News", href: base },
            ...(article.category_name && article.category_slug
              ? [{ name: article.category_name, href: `${base}?${isLearn ? "topic" : "category"}=${article.category_slug}` }]
              : []),
            { name: article.title ?? "" },
          ]}
        />

        <header className="mt-6 max-w-[72ch]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mono-label text-muted-foreground">{metaParts.filter(Boolean).join(" · ")}</p>
            {isLearn ? <LevelBadge level={article.level} /> : null}
          </div>
          <h1 className="display-lg mt-3 text-balance">{article.title}</h1>
          {article.excerpt ? (
            <p className="body-lg mt-4 text-muted-foreground">{article.excerpt}</p>
          ) : null}
          <div className="mt-6">
            <AuthorByline name={article.author_name} role={article.author_role} />
          </div>
        </header>

        {cover ? (
          <figure className="mt-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-muted ring-1 ring-border">
              <Image
                src={cover}
                alt={article.cover_image_alt ?? article.title ?? "Cover"}
                fill
                priority
                sizes="(min-width: 1280px) 1152px, 100vw"
                className="object-cover"
              />
            </div>
            {article.cover_caption || article.cover_credit ? (
              <figcaption className="caption mt-2 text-muted-foreground">
                {[article.cover_caption, article.cover_credit].filter(Boolean).join(" · ")}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {hasToc ? (
          <div className="mt-12 lg:grid lg:grid-cols-[210px_minmax(0,72ch)] lg:gap-14">
            <div className="mb-8 lg:mb-0 lg:sticky lg:top-28 lg:self-start">
              <ArticleToc headings={tocHeadings} />
            </div>
            <div className="min-w-0">{bodyContent}</div>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-[72ch]">{bodyContent}</div>
        )}
      </article>

      {relatedProducts.length > 0 || relatedArticles.length > 0 ? (
        <section className="container pb-expansive">
          {relatedProducts.length > 0 ? (
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="mono-label text-accent-text">PRODUK TERKAIT</p>
                  <h2 className="display-md mt-2">Perangkat yang relevan</h2>
                </div>
                <TrackedLink
                  href="/products"
                  ctaId="article_lihat_katalog"
                  location="article_detail"
                  className="mono-label text-accent-text transition-colors hover:text-foreground"
                >
                  Lihat di Catalog →
                </TrackedLink>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>
          ) : null}

          {relatedArticles.length > 0 ? (
            <div className={relatedProducts.length > 0 ? "mt-16" : undefined}>
              <p className="mono-label text-accent-text">ARTIKEL LAIN</p>
              <h2 className="display-md mt-2">Bacaan terkait</h2>
              <div className="mt-6 grid gap-x-4 gap-y-8 md:grid-cols-3">
                {relatedArticles.map((a) => (
                  <ArticleHubCard key={a.slug} article={a} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
