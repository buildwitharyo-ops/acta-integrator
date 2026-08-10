import { TrackedLink } from "@/components/shared/TrackedLink";
import { ParticleNetwork } from "@/components/ui/particle-network";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { Button } from "@/components/ui/button";
import { HERO_DEFAULTS, stripTrailingArrow } from "@/lib/home-hero";

// Shape + fallback copy live in lib/home-hero so the homepage OG card renders the same
// hero the page does. Re-exported here because `page.tsx` imports the type alongside Hero.
export type { HeroContent } from "@/lib/home-hero";
import type { HeroContent } from "@/lib/home-hero";

export function Hero({
  content,
}: {
  content: HeroContent;
  image?: string | null;
}) {
  return (
    <section className="relative flex min-h-[92svh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <ParticleNetwork />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background)/0.75))]" />

      <div className="container relative z-10 flex flex-col items-center py-24 text-center">
        <p className="mono-label text-accent-text">
          {content.eyebrow ?? HERO_DEFAULTS.eyebrow}
        </p>

        <h1 className="display-xl mt-5 max-w-[18ch]">
          {content.headline_1 ?? HERO_DEFAULTS.headline_1}
          <br />
          {content.headline_2 ?? HERO_DEFAULTS.headline_2}
        </h1>

        <p className="body-lg mt-6 max-w-[54ch] text-foreground/80">
          {content.subheadline ?? HERO_DEFAULTS.subheadline}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <WhatsAppCTA
            context="general"
            label={content.cta_primary?.label ?? HERO_DEFAULTS.cta_primary_label}
            size="lg"
            emphasis="orbit"
          />
          <Button asChild variant="glass" size="lg">
            <TrackedLink
              href={content.cta_secondary?.href ?? HERO_DEFAULTS.cta_secondary_href}
              ctaId="hero_secondary"
              location="home_hero"
            >
              {stripTrailingArrow(
                content.cta_secondary?.label ?? HERO_DEFAULTS.cta_secondary_label,
              )}
            </TrackedLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
