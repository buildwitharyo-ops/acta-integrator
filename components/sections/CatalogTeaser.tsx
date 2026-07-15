import { FeatureCarousel, type FeatureItem } from "@/components/ui/feature-carousel";
import { categoryIcon } from "@/components/shared/section-icons";
import { mediaUrl } from "@/lib/media";

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
  const items: FeatureItem[] = categories
    .filter((c) => c.slug)
    .map((c) => ({
      key: c.slug!,
      icon: categoryIcon(c.slug),
      title: c.name ?? "",
      meta: `${c.count} produk`,
      description: c.description ?? "",
      href: `/products/c/${c.slug}`,
      image: mediaUrl(c.image),
      imageAlt: c.name ? `Contoh perangkat kategori ${c.name}` : "Perangkat AV",
    }));

  return (
    <section className="container py-compact">
      <p className="mono-label text-accent-text">CATALOG</p>
      <h2 className="display-lg mt-2.5 max-w-[20ch]">
        {content.headline ?? "Professional Gear, Curated by Need."}
      </h2>

      <p className="body-md mt-3 max-w-[62ch] text-muted-foreground">
        {content.subheadline ??
          "Enam kategori perangkat yang kami desain, pasok, dan integrasikan. Harga mengikuti kebutuhan project — minta penawaran, tim kami respons cepat."}
      </p>

      {items.length > 0 ? (
        <FeatureCarousel items={items} ctaLabel="Lihat kategori" className="mt-6" />
      ) : null}
    </section>
  );
}
