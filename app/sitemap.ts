import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/queries/articles";
import { getProductCategories, getProducts } from "@/lib/queries/products";
import { getSolutions } from "@/lib/queries/solutions";
import { SITE_URL } from "@/lib/site-url";

// Dynamic sitemap (03 §7.4). All entries are PUBLISHED-only — the v_* views used by these queries
// each filter status='published', so drafts can never appear. /admin, /api, and /products/compare
// are excluded (noindex, per robots.ts). lastModified comes from each row's updated_at.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [solutions, products, categories, news, learn] = await Promise.all([
    getSolutions(),
    getProducts(),
    getProductCategories(),
    getArticles("news"),
    getArticles("learn"),
  ]);

  const url = (path: string) => `${SITE_URL}${path}`;
  const mod = (d?: string | null) => (d ? new Date(d) : undefined);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1.0 },
    { url: url("/solutions"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/products"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/learn"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/news"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: url("/about"), changeFrequency: "yearly", priority: 0.5 },
  ];

  const solutionEntries: MetadataRoute.Sitemap = solutions
    .filter((s) => s.slug)
    .map((s) => ({ url: url(`/solutions/${s.slug}`), lastModified: mod(s.updated_at), changeFrequency: "monthly", priority: 0.9 }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug)
    .map((c) => ({ url: url(`/products/c/${c.slug}`), changeFrequency: "weekly", priority: 0.8 }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.slug)
    .map((p) => ({ url: url(`/products/${p.slug}`), lastModified: mod(p.updated_at), changeFrequency: "monthly", priority: 0.7 }));

  const newsEntries: MetadataRoute.Sitemap = news
    .filter((a) => a.slug)
    .map((a) => ({ url: url(`/news/${a.slug}`), lastModified: mod(a.updated_at ?? a.published_at), changeFrequency: "monthly", priority: 0.6 }));

  const learnEntries: MetadataRoute.Sitemap = learn
    .filter((a) => a.slug)
    .map((a) => ({ url: url(`/learn/${a.slug}`), lastModified: mod(a.updated_at ?? a.published_at), changeFrequency: "monthly", priority: 0.7 }));

  return [...staticEntries, ...solutionEntries, ...categoryEntries, ...productEntries, ...newsEntries, ...learnEntries];
}
