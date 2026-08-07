import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ToolPageBody } from "@/components/learn/alat/ToolPageBody";
import { JsonLd } from "@/components/shared/JsonLd";
import { ORG_ID, breadcrumbNode } from "@/lib/jsonld";
import { TOOL_SLUGS, getToolEntry } from "@/lib/learn/tool-registry";
import type { LearnTool } from "@/lib/learn/types";
import { getLearnLessons } from "@/lib/queries/learn/lessons";
import { getLearnTool, getLearnTools } from "@/lib/queries/learn/tools";
import { getRedirectDestination } from "@/lib/queries/redirects";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

/**
 * `/learn/alat/[slug]` — the calculator pages (03-UI §12.6, §14.1).
 *
 * **Rendering.** This is the one deliberate exception to the rule that no learn
 * route reads `searchParams`. The route accepts them and is therefore rendered per
 * request, which is correct rather than a compromise: dynamic SSR still emits
 * complete HTML with the computed result (better for crawlers than a static shell
 * a crawler has to execute JavaScript to fill), the result set is unbounded by
 * definition so there is no prerender set worth preserving, and it is three
 * routes. Every DB read below goes through `unstable_cache` with the `learn` and
 * `alat:{slug}` tags, so per-request rendering costs a pure, sub-millisecond
 * `compute()` and nothing else.
 *
 * **Caching is tag-based only.** There is no time-based revalidation anywhere in
 * this codebase; a query whose tag nothing fires is stale forever. Do not add
 * `revalidate = N` here.
 *
 * **Indexation, exactly (§12.1).**
 *   bare path      → self-canonical, indexable, in the sitemap, JSON-LD emitted.
 *   any ?params    → `robots: { index: false, follow: true }`, canonical → the
 *                    bare path, never in the sitemap, no JSON-LD.
 * `robots.txt` gets NO `Disallow: /*?…`: `noindex` only functions if the URL stays
 * crawlable, and a disallowed-but-linked URL gets indexed URL-only with the
 * canonical never read.
 *
 * **No bot protection on this route.** The volume leader in this market returns
 * 403 to non-browser agents; being the only cleanly fetchable Indonesian source
 * with correct arithmetic is a free asymmetry, and it is worth defending.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const tools = await getLearnTools();
  // Start from the CMS, keep only rows whose `component_key` names code that
  // exists, then union the registry's own keys so all three calculators are known
  // to the router even before an editor has written their rows.
  const published = tools
    .filter((tool) => getToolEntry(tool.component_key) !== null)
    .map((tool) => tool.slug);
  // TOOL_SLUGS, not TOOL_KEYS: the dynamic segment is the kebab-case URL slug,
  // while a `component_key` is PascalCase and would generate `/learn/alat/Rt60Sabine`.
  const slugs = new Set<string>([...published, ...TOOL_SLUGS]);
  return [...slugs].map((slug) => ({ slug }));
}

/**
 * The registry is authoritative for which calculator lives at which URL — the
 * three paths in §12.1 are frozen. The `learn_tools` row is an editorial overlay,
 * and it is only applied when it names the same code: the arithmetic, the method,
 * the standards and the worked examples are all in the repo, so a calculator whose
 * row has not been written yet still renders a complete page instead of a 404.
 *
 * `key` is the PascalCase `component_key` (`entry.key`), never the URL slug —
 * `learn_tools.component_key` carries a `^[A-Z][A-Za-z0-9]*$` CHECK, so comparing
 * it against the kebab-case slug would never match and would silently discard
 * every row's `seo_title`, `intro_md`, `method_md` and `related_slugs`.
 */
function resolveOverlay(record: LearnTool | null, key: string): LearnTool | null {
  if (!record) return null;
  return record.component_key === key ? record : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getToolEntry(slug);
  if (!entry) return {};

  const [record, query] = await Promise.all([getLearnTool(slug), searchParams]);
  const overlay = resolveOverlay(record, entry.key);
  const computation = entry.build(query);

  const title = `${overlay?.seo_title ?? entry.seoTitle} | ACTA`;
  const meta = buildMetadata({
    title,
    description: overlay?.seo_description ?? entry.seoDescription,
    path: entry.path,
  });
  const description = typeof meta.description === "string" ? meta.description : undefined;

  // The share card carries the reader's own numbers. `ogSlug` is the bare slug
  // when nothing was parameterised, so an untouched page keeps a stable, cacheable
  // image URL. See ./opengraph-image.tsx for why the state rides the path segment.
  const ogUrl = absoluteUrl(`/learn/alat/${computation.ogSlug}/opengraph-image`);
  const ogAlt = `${entry.shortName} — ${computation.view.og.headline}`;

  return {
    ...meta,
    // canonical stays `entry.path` (from buildMetadata) in BOTH states, which is
    // exactly the §12.1 contract for a parameterised URL.
    robots: computation.hasParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(entry.path),
      siteName: "ACTA",
      locale: "id_ID",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: ogAlt }],
    },
  };
}

/* ------------------------------------------------------------------ *
 * JSON-LD — TechArticle + BreadcrumbList, and nothing else (§8.4)
 * ------------------------------------------------------------------ */

/**
 * No `SoftwareApplication`: the value of this page is the explanation, not the
 * app, and Google has no rich result that would reward the claim. No `FAQPage`
 * (the rich result ended 2026-05-07), no `HowTo` (removed), no
 * `LearningResource`, no `Course` — `ItemList` + `Course` live only on the /learn
 * hub, the one place the Course List carousel still applies.
 *
 * Dates are emitted only when a `learn_tools` row supplies them. A calculator with
 * no row gets no date rather than a plausible-looking one: an unverifiable
 * freshness claim is worth less than none.
 */
function techArticleNode(input: {
  headline: string;
  description: string;
  path: string;
  image: string;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    description: input.description,
    image: [input.image],
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "id-ID",
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
    url: absoluteUrl(input.path),
  };
}

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const entry = getToolEntry(slug);

  if (!entry) {
    const destination = await getRedirectDestination(`/learn/alat/${slug}`);
    if (destination) permanentRedirect(destination);
    notFound();
  }

  const [record, query] = await Promise.all([getLearnTool(slug), searchParams]);
  const overlay = resolveOverlay(record, entry.key);
  const computation = entry.build(query);

  // Titles for the row's `related_slugs`. Soft reference, no FK: a renamed lesson
  // leaves a dangling entry, so an unresolved slug renders as nothing at all.
  const relatedSlugs = overlay?.related_slugs ?? [];
  const relatedLessons: Record<string, string> = {};
  if (relatedSlugs.length > 0) {
    for (const lesson of await getLearnLessons()) {
      if (relatedSlugs.includes(lesson.slug)) relatedLessons[lesson.slug] = lesson.title;
    }
  }

  // Parameterised URLs are noindex, so they emit no structured data — which also
  // guarantees the BreadcrumbList never contains an item pointing at a noindex URL.
  const jsonLd = computation.hasParams
    ? null
    : [
        breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: "Alat", path: "/learn/alat" },
          { name: entry.shortName, path: entry.path },
        ]),
        techArticleNode({
          headline: entry.h1,
          description: overlay?.seo_description ?? entry.seoDescription,
          path: entry.path,
          image: absoluteUrl(`/learn/alat/${entry.slug}/opengraph-image`),
          datePublished: overlay?.published_at ?? null,
          dateModified: overlay?.updated_at ?? null,
        }),
      ];

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ToolPageBody
        entry={entry}
        computation={computation}
        record={overlay}
        relatedLessons={relatedLessons}
      />
    </>
  );
}
