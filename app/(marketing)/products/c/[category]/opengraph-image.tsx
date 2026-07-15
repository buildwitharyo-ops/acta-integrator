import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getProductCategories } from "@/lib/queries/products";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Catalog Category";

export async function generateStaticParams() {
  const categories = await getProductCategories();
  return categories.filter((c) => c.slug).map((c) => ({ category: c.slug! }));
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categories = await getProductCategories();
  const cat = categories.find((c) => c.slug === category);
  return renderOgImage({
    eyebrow: "Catalog",
    title: cat?.name ?? "Katalog Produk",
    subtitle: cat?.description ?? "Perangkat AV komersial, dikurasi per kebutuhan.",
  });
}
