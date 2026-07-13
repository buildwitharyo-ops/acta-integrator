import Image from "next/image";
import Link from "next/link";
import { formatArticleDate } from "@/lib/article";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ArticleCardRow = {
  type: string | null;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  cover_image_alt: string | null;
  category_name: string | null;
  level: string | null;
  reading_time: number | null;
  published_at: string | null;
};

export function LevelBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const menengah = level.toLowerCase() === "menengah";
  return (
    <span
      className={cn(
        "mono-label rounded-pill border px-2 py-0.5",
        menengah ? "border-primary/50 text-accent-text" : "border-border text-muted-foreground",
      )}
    >
      {menengah ? "Menengah" : "Dasar"}
    </span>
  );
}

export function ArticleHubCard({ article, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" }: {
  article: ArticleCardRow;
  sizes?: string;
}) {
  const img = mediaUrl({ storage_path: article.cover_image_path, external_url: article.cover_image_url_ext });
  const base = article.type === "news" ? "/news" : "/learn";
  const isLearn = article.type === "learn";
  const meta = isLearn
    ? [article.category_name?.toUpperCase(), article.reading_time ? `${article.reading_time} MENIT BACA` : null]
    : [article.category_name?.toUpperCase(), formatArticleDate(article.published_at)];

  return (
    <Link
      href={`${base}/${article.slug}`}
      className="group block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[16px] bg-muted ring-1 ring-border">
        {img ? (
          <Image src={img} alt={article.cover_image_alt ?? article.title ?? "Artikel"} fill sizes={sizes} className="object-cover" />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="mono-label text-muted-foreground">{meta.filter(Boolean).join(" · ")}</p>
        {isLearn ? <LevelBadge level={article.level} /> : null}
      </div>
      <h3 className="heading-md mt-2 line-clamp-2 text-foreground transition-colors group-hover:text-accent-text">
        {article.title}
      </h3>
      {article.excerpt ? (
        <p className="body-sm mt-1.5 line-clamp-2 text-muted-foreground">{article.excerpt}</p>
      ) : null}
    </Link>
  );
}
