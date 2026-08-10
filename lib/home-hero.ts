// Single source of truth for the homepage Hero's CMS shape + its fallback copy (04 §2).
//
// Both `components/sections/Hero.tsx` and the homepage OG card read from here. The share
// card is a screenshot-by-proxy of the hero: if the two kept their own copies of the
// fallback strings, editing one would silently desync the other, and a link shared to
// WhatsApp would advertise a headline the page no longer has.

export type HeroContent = {
  eyebrow?: string;
  headline_1?: string;
  headline_2?: string;
  subheadline?: string;
  cta_primary?: { label?: string; href?: string };
  cta_secondary?: { label?: string; href?: string };
  annotations?: { label?: string }[];
  image_media_id?: string | null;
};

export const HERO_DEFAULTS = {
  eyebrow: "COMMERCIAL AV / MULTIMEDIA SYSTEMS INTEGRATOR",
  headline_1: "Technology,",
  headline_2: "Without Friction.",
  subheadline:
    "We design, integrate, and support AV environments that feel effortless to use, reliable to operate, and built for the way people work.",
  cta_primary_label: "Konsultasi Gratis",
  cta_secondary_label: "Lihat Solutions",
  cta_secondary_href: "/solutions",
} as const;

// The hero button strips a trailing arrow an editor may have typed into the label
// (the component supplies its own affordance). The OG pill mirrors that exactly.
export function stripTrailingArrow(label: string): string {
  return label.replace(/\s*→\s*$/, "");
}

/**
 * Flatten a `page_sections.home/hero` row into the exact strings the Hero renders.
 *
 * `??` — not `||` — on purpose: it matches the component's own nullish fallbacks, so an
 * editor who deliberately clears `headline_2` to get a one-line headline gets a one-line
 * headline on the card too, instead of the default sneaking back in.
 */
export function resolveHeroContent(content?: HeroContent | null) {
  const c = content ?? {};
  return {
    eyebrow: c.eyebrow ?? HERO_DEFAULTS.eyebrow,
    headline1: c.headline_1 ?? HERO_DEFAULTS.headline_1,
    headline2: c.headline_2 ?? HERO_DEFAULTS.headline_2,
    subheadline: c.subheadline ?? HERO_DEFAULTS.subheadline,
    ctaPrimary: c.cta_primary?.label ?? HERO_DEFAULTS.cta_primary_label,
    ctaSecondary: stripTrailingArrow(c.cta_secondary?.label ?? HERO_DEFAULTS.cta_secondary_label),
  };
}
