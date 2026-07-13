import Image from "next/image";
import Link from "next/link";
import { formatArticleDate } from "@/lib/article";
import { mediaUrl } from "@/lib/media";
import { LevelBadge, type ArticleCardRow } from "./ArticleHubCard";

export function FeaturedArticle({ article }: { article: ArticleCardRow }) {
  const img = mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext });
  const base = article.type === "news" ? "/news" : "/learn";
  const isLearn = article.type === "learn";

  return (
    <Link
      href={`${base}/${article.slug}`}
      className="group grid gap-6 rounded-[26px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background md:grid-cols-2 md:items-center md:gap-10"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-muted ring-1 ring-border md:aspect-[3/2]">
        {img ? (
          <Image
            src={img}
            alt={article.cover_image_alt ?? article.title ?? "Artikel"}
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>

      <div>
        {isLearn ? (
          <div className="flex items-center gap-2">
            <p className="mono-label text-muted-foreground">
              {[article.category_name?.toUpperCase(), article.reading_time ? `${article.reading_time} MENIT BACA` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <LevelBadge level={article.level} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="font-mono text-3xl tabular-nums text-foreground md:text-4xl">
              {formatArticleDate(article.published_at).toUpperCase()}
            </p>
            {article.category_name ? (
              <span className="mono-label rounded-pill bg-primary/10 px-2.5 py-1 text-accent-text">
                {article.category_name}
              </span>
            ) : null}
          </div>
        )}

        <h2 className="display-lg mt-4 line-clamp-3 text-balance transition-colors group-hover:text-accent-text">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="body-lg mt-4 max-w-[52ch] text-muted-foreground">{article.excerpt}</p>
        ) : null}
        <span className="mono-label mt-5 inline-block text-accent-text transition-transform duration-300 group-hover:translate-x-1">
          Baca →
        </span>
      </div>
    </Link>
  );
}
