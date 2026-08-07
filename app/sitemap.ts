import type { MetadataRoute } from "next";
import { LEARN_LAUNCH_MIN_LESSONS } from "@/lib/learn/noindex";
import { ROOM_ARCHETYPE_SLUGS } from "@/lib/learn/rooms";
import { getArticles } from "@/lib/queries/articles";
import { getPublishedLessonCount } from "@/lib/queries/learn/lessons";
import { getLearnPaths } from "@/lib/queries/learn/paths";
import { getLearnToolSlugs } from "@/lib/queries/learn/tools";
import { getProductCategories, getProducts } from "@/lib/queries/products";
import { getSolutions } from "@/lib/queries/solutions";
import { SITE_URL } from "@/lib/site-url";

// Dynamic sitemap (03 §7.4). All entries are PUBLISHED-only — the v_* views used by these queries
// each filter status='published', so drafts can never appear. /admin, /api, and /products/compare
// are excluded (noindex, per robots.ts). lastModified comes from each row's updated_at.
//
// No `changeFrequency`, no `priority` (04 §17.0 P0-5): Google ignores both. They are self-reported
// claims a site can set to anything, so they carry no signal and only invite drift between what the
// XML asserts and what the rows actually do. `lastModified` stays exactly as it is — it reads real
// row timestamps (updated_at, falling back to published_at), which is precisely why it is trusted.
// Entries with no timestamp to report (static routes, category hubs whose view exposes no updated_at)
// emit a bare <loc> rather than a fabricated date.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [solutions, products, categories, news, learn, lessonCount, learnPaths, toolSlugs] =
    await Promise.all([
      getSolutions(),
      getProducts(),
      getProductCategories(),
      getArticles("news"),
      getArticles("learn"),
      getPublishedLessonCount(),
      getLearnPaths(),
      getLearnToolSlugs(),
    ]);

  const url = (path: string) => `${SITE_URL}${path}`;
  const mod = (d?: string | null) => (d ? new Date(d) : undefined);

  // The /learn launch gate (lib/learn/noindex.ts) also governs the sitemap. Below the
  // threshold every /learn page is `noindex`, and listing a noindex URL in a sitemap is
  // a contradictory signal — it asks Google to crawl a page that then tells it to leave.
  // The calculators are exempt: they are complete, standalone, and correct on day one,
  // and they do not depend on lesson volume to be worth indexing.
  const learnLaunched = lessonCount >= LEARN_LAUNCH_MIN_LESSONS;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: url("/") },
    { url: url("/solutions") },
    { url: url("/products") },
    { url: url("/news") },
    { url: url("/contact") },
    { url: url("/about") },
    { url: url("/privasi") },
    // Tool index is always listed — see the exemption above.
    { url: url("/learn/alat") },
    ...(learnLaunched
      ? [
          { url: url("/learn") },
          { url: url("/learn/jalur") },
          { url: url("/learn/ruang") },
          { url: url("/learn/glosarium") },
        ]
      : []),
  ];

  // Calculators: BARE paths only. Any `?params` URL is noindex + canonical to the bare
  // path (03 §12.1) and must never appear here.
  const toolEntries: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: url(`/learn/alat/${slug}`),
  }));

  const pathEntries: MetadataRoute.Sitemap = learnLaunched
    ? learnPaths
        .filter((p) => p.slug)
        .map((p) => ({ url: url(`/learn/jalur/${p.slug}`), lastModified: mod(p.updated_at) }))
    : [];

  const roomEntries: MetadataRoute.Sitemap = learnLaunched
    ? ROOM_ARCHETYPE_SLUGS.map((slug) => ({ url: url(`/learn/ruang/${slug}`) }))
    : [];

  const solutionEntries: MetadataRoute.Sitemap = solutions
    .filter((s) => s.slug)
    .map((s) => ({ url: url(`/solutions/${s.slug}`), lastModified: mod(s.updated_at) }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug)
    .map((c) => ({ url: url(`/products/c/${c.slug}`) }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.slug)
    .map((p) => ({ url: url(`/products/${p.slug}`), lastModified: mod(p.updated_at) }));

  const newsEntries: MetadataRoute.Sitemap = news
    .filter((a) => a.slug)
    .map((a) => ({ url: url(`/news/${a.slug}`), lastModified: mod(a.updated_at ?? a.published_at) }));

  const learnEntries: MetadataRoute.Sitemap = learnLaunched
    ? learn
        .filter((a) => a.slug)
        .map((a) => ({
          url: url(`/learn/${a.slug}`),
          lastModified: mod(a.updated_at ?? a.published_at),
        }))
    : [];

  return [
    ...staticEntries,
    ...solutionEntries,
    ...categoryEntries,
    ...productEntries,
    ...newsEntries,
    ...learnEntries,
    ...pathEntries,
    ...toolEntries,
    ...roomEntries,
  ];
}
