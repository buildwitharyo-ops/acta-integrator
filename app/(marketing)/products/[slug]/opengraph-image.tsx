import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getProducts, getPublishedProductDetail } from "@/lib/queries/products";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Product";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.filter((p) => p.slug).map((p) => ({ slug: p.slug! }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductDetail(slug);
  // First non-placeholder photo (real product shots preferred; skip TO-REPLACE stock).
  const hero = (product?.images ?? []).find((im) => !im.is_placeholder) ?? null;
  const heroUrl = hero ? mediaUrl({ storage_path: hero.storage_path, external_url: hero.external_url }) : null;
  return renderOgImage({
    eyebrow: `Product / ${product?.brand_name ?? "ACTA"}`,
    title: product?.name ?? "Produk AV",
    subtitle: product?.short_spec ?? null,
    heroUrl,
  });
}
