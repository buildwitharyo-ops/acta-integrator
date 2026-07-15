import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import type { SignalStage } from "@/components/shared/SignalChainDiagram";
import { PainPoints } from "@/components/solutions/PainPoints";
import { RelatedArticles } from "@/components/solutions/RelatedArticles";
import { RelatedProducts } from "@/components/solutions/RelatedProducts";
import { ScopePillars } from "@/components/solutions/ScopePillars";
import { SolutionCta } from "@/components/solutions/SolutionCta";
import { SolutionHero } from "@/components/solutions/SolutionHero";
import { SystemDesign } from "@/components/solutions/SystemDesign";
import { breadcrumbNode, serviceNode } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";
import { getSolutionArticles } from "@/lib/queries/articles";
import { getRedirectDestination } from "@/lib/queries/redirects";
import { getSolutionBySlug, getSolutionProducts, getSolutions } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams() {
  const solutions = await getSolutions();
  return solutions.filter((s) => s.slug).map((s) => ({ slug: s.slug! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);
  if (!solution) return {};

  // OG image comes from ./opengraph-image.tsx (branded template + hero) — no ogImage here.
  return buildMetadata({
    title: solution.seo_title ?? solution.name ?? undefined,
    description: solution.seo_description ?? solution.value_prop ?? undefined,
    path: `/solutions/${slug}`,
  });
}

type Section = { type: string | null; heading: string | null; body: string | null; items: unknown };
type ListItem = { title?: string; body?: string; description?: string };

export default async function SolutionDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const solution = await getSolutionBySlug(slug, { preview });

  if (!solution) {
    const dest = await getRedirectDestination(`/solutions/${slug}`);
    if (dest) permanentRedirect(dest);
    notFound();
  }

  const name = solution.name ?? slug;
  const tags = solution.tags ?? [];

  const [products, articles] = await Promise.all([
    getSolutionProducts(slug),
    getSolutionArticles(slug, tags),
  ]);

  const sections = (solution.sections ?? []) as Section[];
  const findSection = (type: string) => sections.find((s) => s.type === type);
  const pain = findSection("pain_points");
  const system = findSection("system_copy");
  const scope = findSection("scope_pillar");
  const cta = findSection("cta");

  const asList = (items: unknown): ListItem[] => (Array.isArray(items) ? (items as ListItem[]) : []);
  const stages = (Array.isArray(solution.signal_chain) ? solution.signal_chain : []) as SignalStage[];
  const annotations = (Array.isArray(solution.hero_annotations) ? solution.hero_annotations : []) as {
    label: string;
  }[];

  // Narrative beats numbered only across the sections actually present.
  let beat = 0;
  const painEyebrow = pain ? `${String(++beat).padStart(2, "0")} — TANTANGAN` : "";
  const systemEyebrow = system || stages.length ? `${String(++beat).padStart(2, "0")} — SISTEM` : "";
  const scopeEyebrow = scope ? `${String(++beat).padStart(2, "0")} — SCOPE OF WORK` : "";

  const heroHeadline = solution.hero_headline ?? solution.value_prop ?? name;
  const heroSubcopy = solution.hero_subcopy ?? (solution.hero_headline ? solution.value_prop : null);

  const jsonLd = [
    serviceNode({
      name,
      description: solution.seo_description ?? solution.value_prop,
      path: `/solutions/${slug}`,
    }),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Solutions", path: "/solutions" },
      { name, path: `/solutions/${slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container pt-8 md:pt-10">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Solutions", href: "/solutions" },
            { name },
          ]}
        />
      </div>

      <SolutionHero
        name={name}
        headline={heroHeadline}
        subcopy={heroSubcopy}
        waMessage={solution.wa_message}
        image={{
          url: mediaUrl({ storage_path: solution.hero_image_path, external_url: solution.hero_image_url_ext }),
          alt: solution.hero_image_alt,
        }}
        annotations={annotations}
        hasProducts={products.length > 0}
      />

      {pain ? (
        <PainPoints
          eyebrow={painEyebrow}
          heading={pain.heading ?? "Tantangan yang kami selesaikan"}
          items={asList(pain.items)}
        />
      ) : null}

      {system || stages.length ? (
        <SystemDesign
          eyebrow={systemEyebrow}
          heading={system?.heading ?? "Sistem yang kami rancang"}
          body={system?.body}
          stages={stages}
        />
      ) : null}

      {scope ? (
        <ScopePillars
          eyebrow={scopeEyebrow}
          heading={scope.heading ?? "Scope of Work"}
          items={asList(scope.items)}
        />
      ) : null}

      <RelatedProducts products={products} categorySlug={solution.related_category_slugs?.[0] ?? null} />

      <RelatedArticles articles={articles} />

      <SolutionCta
        heading={cta?.heading ?? "Ceritakan kebutuhan Anda — kami bantu rancang sistemnya."}
        solutionName={name}
        solutionSlug={slug}
        waMessage={solution.wa_message}
      />
    </>
  );
}
