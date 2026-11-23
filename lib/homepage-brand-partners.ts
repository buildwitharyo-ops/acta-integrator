import maskSources from "./homepage-brand-masks.json";
import source from "./homepage-brand-partners.json";

const masks = new Map(Object.entries(maskSources));

// Exact genuine marks from the supplied company profile's page 4.
// These are functional groups; the document establishes no dealer or certification tiers.
export const HOMEPAGE_BRAND_PARTNERS = source.brands.map(({ slug, name }) => {
  const original = `/brands/homepage-profile/${slug}.png`;
  return { slug, name, src: masks.get(original) ?? original };
});

export const HOMEPAGE_BRAND_GROUPS = source.groups.map((group) => ({
  id: group.id,
  label: group.label,
  logos: group.slugs.flatMap((slug) => {
    const brand = HOMEPAGE_BRAND_PARTNERS.find((item) => item.slug === slug);
    return brand ? [brand] : [];
  }),
}));
