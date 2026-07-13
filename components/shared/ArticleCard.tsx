import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ArticleCardData = {
  id: string | null;
  type: string | null;
  slug: string | null;
  title: string | null;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  published_at: string | null;
};

export function ArticleCard({
  article,
  sizes = "(min-width: 768px) 33vw, 100vw",
}: {
  article: ArticleCardData;
  sizes?: string;
}) {
  const img = mediaUrl({
    storage_path: article.cover_image_path,
    external_url: article.cover_image_url_ext,
  });
  const base = article.type === "news" ? "/news" : "/learn";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("id-ID", { month: "2-digit", year: "2-digit" })
    : null;

  return (
    <Link
      href={`${base}/${article.slug}`}
      className="group block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-[16px] bg-card ring-1 ring-border">
        {img ? (
          <Image src={img} alt={article.title ?? "Artikel"} fill sizes={sizes} className="object-cover" />
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={cn(
            "mono-label rounded-pill px-2.5 py-1",
            article.type === "news"
              ? "text-accent-text ring-1 ring-primary/40"
              : "text-muted-foreground ring-1 ring-border",
          )}
        >
          {article.type === "news" ? "NEWS" : "LEARN"}
        </span>
        {date ? <span className="mono-spec text-muted-foreground">{date}</span> : null}
      </div>
      <p className="heading-md mt-2 line-clamp-2 transition-colors group-hover:text-accent-text">
        {article.title}
      </p>
    </Link>
  );
}
