import type { Metadata } from "next";
import { MarqueeStrip } from "@/components/shared/MarqueeStrip";
import { Reveal } from "@/components/shared/Reveal";
import { ArticlesPreview } from "@/components/sections/ArticlesPreview";
import { CatalogTeaser } from "@/components/sections/CatalogTeaser";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero, type HeroContent } from "@/components/sections/Hero";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { SolutionsBento } from "@/components/sections/SolutionsBento";
import { Testimonials } from "@/components/sections/Testimonials";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { getMixedArticleFeed } from "@/lib/queries/articles";
import { getCategoryPreviews } from "@/lib/queries/products";
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
  const [sections, settings, solutions, categoryPreviews, articles] = await Promise.all([
    getPageSections("home"),
    getSiteSettings(),
    getSolutions(),
    getCategoryPreviews(),
    getMixedArticleFeed(),
  ]);

  const get = <T,>(key: string): T => (sections[key] ?? {}) as unknown as T;
  const trust = get<{ label?: string }>("trust_strip");

  return (
    <>
      <Hero content={get<HeroContent>("hero")} image={null} />

      <MarqueeStrip logos={BRAND_LOGOS} heading={trust.label ?? "Technology We Work With"} />

      <SolutionsBento
        content={get<{ headline?: string; subheadline?: string }>("solutions")}
        solutions={solutions}
      />

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

      <Reveal>
        <ImpactSection />
      </Reveal>

      <Reveal>
        <Testimonials />
      </Reveal>

      <Reveal>
        <ArticlesPreview articles={articles} />
      </Reveal>

      <FinalCta content={get<{ headline?: string; subheadline?: string }>("final_cta")} settings={settings} />
    </>
  );
}
