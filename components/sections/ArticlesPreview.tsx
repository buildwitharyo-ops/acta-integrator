import Link from "next/link";
import { ArticleCard, type ArticleCardData } from "@/components/shared/ArticleCard";
import { Button } from "@/components/ui/button";

export function ArticlesPreview({ articles }: { articles: ArticleCardData[] }) {
  if (articles.length === 0) return null;

  return (
    <section lang="en" aria-labelledby="home-insights" className="container py-section">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-border pb-6">
        <h2 id="home-insights" className="display-lg">AV field notes</h2>
        <Button asChild variant="pill">
          <Link href="/learn">Browse articles <span aria-hidden>↗</span></Link>
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
