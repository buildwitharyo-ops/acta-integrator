import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderProductOgImage } from "@/lib/og/render";
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
  // Gallery order, first non-placeholder photo — the same shot the product page leads with
  // (real product shots preferred; skip TO-REPLACE stock).
  const hero = (product?.images ?? []).find((im) => !im.is_placeholder) ?? null;
  const photoUrl = hero ? mediaUrl({ storage_path: hero.storage_path, external_url: hero.external_url }) : null;

  return renderProductOgImage({
    name: product?.name ?? "Produk AV",
    brand: product?.brand_name ?? null,
    shortSpec: product?.short_spec ?? null,
    photoUrl,
  });
}
