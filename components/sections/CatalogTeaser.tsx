import { FeatureCarousel, type FeatureItem } from "@/components/ui/feature-carousel";
import { categoryIcon } from "@/components/shared/section-icons";
import { mediaUrl } from "@/lib/media";
import { homepageEquipmentCopy } from "./homepage-equipment-copy";
import { ParticleNetwork } from "@/components/ui/particle-network";
import styles from "./CatalogTeaser.module.css";

type CategoryPreview = {
  slug: string | null;
  name: string | null;
  description: string | null;
  count: number;
  image: { storage_path: string | null; external_url: string | null } | null;
};

export function CatalogTeaser({
  content,
  categories,
}: {
  content: { headline?: string; subheadline?: string };
  categories: CategoryPreview[];
}) {
  const items: FeatureItem[] = categories.flatMap((category) => {
    if (!category.slug) return [];
    const name = category.name ?? category.slug;
    return [{
      key: category.slug,
      icon: categoryIcon(category.slug),
      title: name,
      meta: `${category.count} ${category.count === 1 ? "product" : "products"}`,
      description: homepageEquipmentCopy(category.description),
      href: `/products/c/${category.slug}`,
      image: mediaUrl(category.image),
      imageAlt: `${name} equipment from ACTA’s catalog`,
    }];
  });

  return (
    <section lang="en" aria-labelledby="home-catalog-title" className={`py-section ${styles.section}`}>
      <ParticleNetwork className={styles.network} />
      <div aria-hidden="true" className={styles.veil} />
      <div className={`container ${styles.content}`}>
        <header className="mb-6 grid gap-4 border-t border-border pt-5 md:mb-8 md:grid-cols-2 md:items-end md:gap-8">
          <h2 id="home-catalog-title" className="display-lg text-balance">
            {homepageEquipmentCopy(content.headline, "Equipment Catalog")}
          </h2>
          <p className="body-md max-w-[52ch] text-muted-foreground md:justify-self-end">
            {homepageEquipmentCopy(content.subheadline, "Browse equipment by function, review its specifications and request a quotation for your project.")}
          </p>
        </header>
        {items.length > 0 && <FeatureCarousel items={items} ctaLabel="Browse category" />}
      </div>
    </section>
  );
}
