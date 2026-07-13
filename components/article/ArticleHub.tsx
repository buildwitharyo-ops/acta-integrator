import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { Reveal } from "@/components/shared/Reveal";
import { ArticleHubCard, type ArticleCardRow } from "./ArticleHubCard";
import { FeaturedArticle } from "./FeaturedArticle";
import { FilterChips } from "./FilterChips";
import { Pagination } from "./Pagination";

export type HubConfig = {
  type: "news" | "learn";
  eyebrow: string;
  headline: string;
  intro: string;
  paramName: "category" | "topic";
  base: string;
};

function EmptyState({ base }: { base: string }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
      <div aria-hidden className="flex h-1 w-24 items-stretch gap-1">
        {[40, 12, 20, 8, 16].map((w, i) => (
          <span key={i} className="h-full rounded-full bg-border" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="heading-md mt-6">Belum ada artikel di kategori ini.</p>
      <Link href={base} className="mono-label mt-4 text-accent-text underline-offset-4 hover:underline">
        Lihat semua →
      </Link>
    </div>
  );
}

export function ArticleHub({
  config,
  featured,
  articles,
  categories,
  activeCategory,
  page,
  totalPages,
  makeHref,
}: {
  config: HubConfig;
  featured: ArticleCardRow | null;
  articles: ArticleCardRow[];
  categories: { slug: string; name: string }[];
  activeCategory: string | null;
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  return (
    <section className="container py-section">
      <header className="max-w-3xl">
        <p className="mono-label text-accent-text">{config.eyebrow}</p>
        <h1 className="display-xl mt-4 text-balance">{config.headline}</h1>
        <p className="body-lg mt-5 max-w-[58ch] text-muted-foreground">{config.intro}</p>
      </header>

      <MeterDivider annotation="SIGNAL" className="mt-8" />

      {featured ? (
        <div className="mt-10">
          <FeaturedArticle article={featured} />
        </div>
      ) : null}

      <div className="mt-12">
        <FilterChips base={config.base} paramName={config.paramName} categories={categories} active={activeCategory} />
      </div>

      {articles.length === 0 ? (
        <EmptyState base={config.base} />
      ) : (
        <Reveal className="mt-8">
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleHubCard key={a.slug} article={a} />
            ))}
          </div>
        </Reveal>
      )}

      <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
    </section>
  );
}
