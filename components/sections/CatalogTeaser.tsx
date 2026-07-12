import Link from "next/link";
import { FeatureCarousel, type FeatureItem } from "@/components/ui/feature-carousel";
import { Button } from "@/components/ui/button";
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
    <section className="container py-section">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-accent-text">04 / CATALOG</p>
          <h2 className="display-lg mt-3 max-w-[16ch]">
            {content.headline ?? "Professional Gear, Curated by Need."}
          </h2>
        </div>
        <Button asChild variant="pill">
          <Link href="/products">Jelajahi Catalog</Link>
        </Button>
      </div>

      <p className="body-lg mt-5 max-w-[62ch] text-muted-foreground">
        {content.subheadline ??
          "Enam kategori perangkat yang kami desain, pasok, dan integrasikan. Harga mengikuti kebutuhan project — minta penawaran, tim kami respons cepat."}
      </p>

      {items.length > 0 ? (
        <FeatureCarousel items={items} ctaLabel="Lihat kategori" className="mt-8" />
      ) : null}
    </section>
  );
}
