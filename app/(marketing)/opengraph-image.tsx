import { resolveHeroContent } from "@/lib/home-hero";
import { OG_CONTENT_TYPE, OG_SIZE, renderHomeOgImage } from "@/lib/og/render";
import { getHomeHero } from "@/lib/queries/pages";

// Default site-wide OG image — used by every route without its own opengraph-image (home, hubs,
// about, contact, etc.). Detail routes override this with their own segment file.
//
// It renders the homepage Hero as it stands right now: eyebrow, headline, subheadline and CTA
// labels all come from the `home/hero` CMS section the Hero component reads, and the card is
// tagged `page:home`, so an edit in admin rebuilds the share preview with the page. Previously
// this was a hardcoded headline that had already drifted from the live hero.
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// `alt` must be a static export — it cannot follow the CMS the way the artwork does.
export const alt = "ACTA — Commercial AV & Multimedia Systems Integrator, Indonesia";

export default async function OgImage() {
  const { content, imageUrl } = await getHomeHero();
  const hero = resolveHeroContent(content);

  return renderHomeOgImage({
    eyebrow: hero.eyebrow,
    headline1: hero.headline1,
    headline2: hero.headline2,
    subtitle: hero.subheadline,
    ctaPrimary: hero.ctaPrimary,
    ctaSecondary: hero.ctaSecondary,
    backdropUrl: imageUrl,
  });
}
