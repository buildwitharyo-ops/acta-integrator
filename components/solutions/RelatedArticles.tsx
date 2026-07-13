import { ArticleCard, type ArticleCardData } from "@/components/shared/ArticleCard";

export function RelatedArticles({ articles }: { articles: ArticleCardData[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="container py-section">
      <p className="mono-label text-accent-text">INSIGHTS</p>
      <h2 className="display-lg mt-3">Pelajari lebih dalam</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
