import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";

export function RelatedProducts({
  products,
  categorySlug,
}: {
  products: ProductCardData[];
  categorySlug?: string | null;
}) {
  if (products.length === 0) return null;

  return (
    <section id="produk-terkait" className="container scroll-mt-24 py-section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-accent-text">TECHNOLOGY</p>
          <h2 className="display-lg mt-3">Technology We Work With</h2>
        </div>
        {categorySlug ? (
          <Link
            href={`/products/c/${categorySlug}`}
            className="mono-label text-accent-text transition-colors hover:text-foreground"
          >
            Lihat semua di Catalog →
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
