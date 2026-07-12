import type { Metadata } from "next";
import { MarqueeStrip } from "@/components/shared/MarqueeStrip";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { Reveal } from "@/components/shared/Reveal";
import { ArticlesPreview } from "@/components/sections/ArticlesPreview";
import { CatalogTeaser } from "@/components/sections/CatalogTeaser";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero, type HeroContent } from "@/components/sections/Hero";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { Proof } from "@/components/sections/Proof";
import { SolutionsBento } from "@/components/sections/SolutionsBento";
import { WhyActa } from "@/components/sections/WhyActa";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { getMixedArticleFeed } from "@/lib/queries/articles";
import { getCategoryPreviews } from "@/lib/queries/products";
import { getPublishedProjects } from "@/lib/queries/projects";
import { getPageSections } from "@/lib/queries/pages";
import { getSiteSettings } from "@/lib/queries/settings";
import { getSolutions } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ACTA — Commercial AV & Multimedia Systems Integrator Indonesia",
  description:
    "ACTA merancang, memasang, dan merawat sistem audio visual komersial terintegrasi — smart meeting room, auditorium, sound system komersial, hingga digital signage. Jakarta & Tangerang.",
  path: "/",
});

export default async function Home() {
  const [sections, settings, solutions, categoryPreviews, projects, articles] =
    await Promise.all([
      getPageSections("home"),
      getSiteSettings(),
      getSolutions(),
      getCategoryPreviews(),
      getPublishedProjects(),
      getMixedArticleFeed(),
    ]);

  const get = <T,>(key: string): T => (sections[key] ?? {}) as unknown as T;
  const trust = get<{ label?: string }>("trust_strip");

  return (
    <>
      <Hero content={get<HeroContent>("hero")} image={null} />

      <MarqueeStrip logos={BRAND_LOGOS} heading={trust.label ?? "Technology We Work With"} />

      <Reveal>
        <SolutionsBento
          content={get<{ headline?: string; subheadline?: string }>("solutions")}
          solutions={solutions}
        />
      </Reveal>

      <HowWeWork
        content={get<{
          headline?: string;
          steps?: { no?: string; title?: string; description?: string }[];
        }>("how_we_work")}
      />

      <Reveal>
        <CatalogTeaser
          content={get<{ headline?: string; subheadline?: string }>("catalog_teaser")}
          categories={categoryPreviews}
        />
      </Reveal>

      <MeterDivider annotation="05 / SELECTED WORK" className="container my-4" />

      <Reveal>
        <Proof content={get<{ eyebrow?: string; headline?: string }>("proof")} projects={projects} />
      </Reveal>

      <Reveal>
        <WhyActa
          content={get<{
            headline?: string;
            intro?: string;
            points?: { title?: string; description?: string }[];
          }>("why_acta")}
        />
      </Reveal>

      <Reveal>
        <ArticlesPreview articles={articles} />
      </Reveal>

      <FinalCta content={get<{ headline?: string; subheadline?: string }>("final_cta")} settings={settings} />
    </>
  );
}
