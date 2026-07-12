import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Article = {
  id: string | null;
  type: string | null;
  slug: string | null;
  title: string | null;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  published_at: string | null;
};

export function ArticlesPreview({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="container py-section">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-accent-text">07 / INSIGHTS</p>
          <h2 className="display-lg mt-3 max-w-[16ch]">Insights from the AV Industry</h2>
        </div>
        <Button asChild variant="pill">
          <Link href="/learn">Semua Artikel</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const img = mediaUrl({
    storage_path: article.cover_image_path,
    external_url: article.cover_image_url_ext,
  });
  const base = article.type === "news" ? "/news" : "/learn";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("id-ID", { month: "2-digit", year: "2-digit" })
    : null;

  return (
    <Link href={`${base}/${article.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden rounded-[16px] bg-card ring-1 ring-border">
        {img ? (
          <Image src={img} alt={article.title ?? "Artikel"} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
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
