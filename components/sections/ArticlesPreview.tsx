import Link from "next/link";
import { ArticleCard, type ArticleCardData } from "@/components/shared/ArticleCard";
import { Button } from "@/components/ui/button";

export function ArticlesPreview({ articles }: { articles: ArticleCardData[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="container py-section">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-accent-text">INSIGHTS</p>
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
