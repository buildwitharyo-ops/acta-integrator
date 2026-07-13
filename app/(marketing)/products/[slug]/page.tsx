import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import { ImplementationExamples } from "@/components/catalog/ImplementationExamples";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductCtaPanel } from "@/components/catalog/ProductCtaPanel";
import { ProductGallery, type GalleryImage } from "@/components/catalog/ProductGallery";
import { SpecTable } from "@/components/catalog/SpecTable";
import { breadcrumbNode, productNode } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";
import { getRelatedArticlesForProduct } from "@/lib/queries/articles";
import { getRedirectDestination } from "@/lib/queries/redirects";
import {
  getProductCategories,
  getProductImplementation,
  getProducts,
  getPublishedProductDetail,
  getSimilarProducts,
} from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams() {
  const products = await getProducts();
  return products.filter((p) => p.slug).map((p) => ({ slug: p.slug! }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductDetail(slug);
  if (!product) return {};
  const firstImage = product.images?.[0];
  const og = firstImage ? mediaUrl(firstImage) ?? undefined : undefined;
  return buildMetadata({
    title: product.seo_title ?? `${product.name} — ${product.brand_name} | Katalog ACTA`,
    description: product.seo_description ?? product.short_spec ?? product.suitable_for ?? undefined,
    path: `/products/${slug}`,
    ogImage: og,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getPublishedProductDetail(slug);

  if (!product) {
    const dest = await getRedirectDestination(`/products/${slug}`);
    if (dest) permanentRedirect(dest);
    notFound();
  }

  const [similar, articles, implementation, categories, settings] = await Promise.all([
    getSimilarProducts(slug),
    product.brand_slug && product.category_slug
      ? getRelatedArticlesForProduct(product.brand_slug, product.category_slug)
      : Promise.resolve([]),
    getProductImplementation(slug),
    getProductCategories(),
    getSiteSettings(),
  ]);

  const categoryName = product.category_slug
    ? categories.find((c) => c.slug === product.category_slug)?.name ?? null
    : null;

  const galleryImages: GalleryImage[] = (product.images ?? [])
    .map((img): GalleryImage | null => {
      const url = mediaUrl({ storage_path: img.storage_path, external_url: img.external_url });
      return url ? { url, alt: img.alt ?? product.name ?? "", annotation: img.image_annotation ?? null } : null;
    })
    .filter((g): g is GalleryImage => g !== null);

  const platforms =
    product.specs?.find((s) => s.key === "certified_platforms")?.value_options ?? [];

  const claim = settings?.claim_verified ? settings.response_claim ?? null : null;

  const jsonLd = [
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Katalog", path: "/products" },
      ...(categoryName && product.category_slug
        ? [{ name: categoryName, path: `/products/c/${product.category_slug}` }]
        : []),
      { name: product.name ?? slug, path: `/products/${slug}` },
    ]),
    productNode({
      name: product.name ?? slug,
      brand: product.brand_name,
      images: galleryImages.map((g) => g.url),
      description: product.seo_description ?? product.short_spec,
      category: categoryName,
      path: `/products/${slug}`,
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="container pb-28 pt-section lg:pb-section">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Katalog", href: "/products" },
            ...(categoryName && product.category_slug
              ? [{ name: categoryName, href: `/products/c/${product.category_slug}` }]
              : []),
            { name: product.name ?? slug },
          ]}
        />

        <header className="mt-6 max-w-3xl">
          {product.brand_name ? <p className="mono-label text-accent-text">{product.brand_name}</p> : null}
          <h1 className="display-lg mt-2 text-balance">{product.name}</h1>
          {product.suitable_for ? (
            <p className="body-lg mt-4 max-w-[56ch] text-muted-foreground">{product.suitable_for}</p>
          ) : null}
          {platforms.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span key={p} className="mono-label rounded-pill border border-border px-2.5 py-1 text-foreground">
                  {p}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-14">
            <ProductGallery images={galleryImages} productName={product.name ?? "Produk"} />
            <SpecTable specs={product.specs ?? []} brandName={product.brand_name} sourceUrl={product.spec_source_url} />
            <ImplementationExamples projects={implementation} />

            {similar.length > 0 ? (
              <section>
                <h2 className="display-md">Unit Serupa</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {similar.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={{ ...p, category_name: categoryName }}
                      showCompare
                      showQuoteCta
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 90vw"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {articles.length > 0 ? (
              <section>
                <h2 className="display-md">Artikel Terkait</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <ProductCtaPanel
            productName={product.name ?? "produk ini"}
            brandName={product.brand_name}
            slug={slug}
            claim={claim}
          />
        </div>
      </section>
    </>
  );
}
