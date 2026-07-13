import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { GridSkeleton } from "@/components/catalog/GridSkeleton";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { breadcrumbNode, itemListNode } from "@/lib/jsonld";
import { getPageSections } from "@/lib/queries/pages";
import { getCatalogProducts, getProductCategories, getSpecDefinitions } from "@/lib/queries/products";
import { getSolutions } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Katalog Produk AV Komersial — Display, Audio, Conferencing | ACTA",
  description:
    "Perangkat audio visual yang ACTA rancang, pasang, dan integrasikan — bukan toko online. Telusuri per kategori dan minta penawaran sesuai kebutuhan project.",
  path: "/products",
});

export default async function ProductsHubPage() {
  const [products, categories, solutions, specDefs, sections] = await Promise.all([
    getCatalogProducts(),
    getProductCategories(),
    getSolutions(),
    getSpecDefinitions(),
    getPageSections("catalog_hub"),
  ]);

  const intro = (sections["intro"] ?? {}) as { eyebrow?: string; headline?: string; subheadline?: string };

  const cats = categories
    .filter((c) => c.slug && c.name)
    .map((c) => ({ slug: c.slug!, name: c.name! }));
  const sols = solutions
    .filter((s) => s.id && s.slug && s.name)
    .map((s) => ({ id: s.id!, slug: s.slug!, name: s.name! }));

  const jsonLd = [
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Katalog", path: "/products" },
    ]),
    itemListNode(
      products.filter((p) => p.slug).map((p) => ({ name: p.name ?? p.slug!, path: `/products/${p.slug}` })),
    ),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="container py-section">
        <header className="max-w-3xl">
          <p className="mono-label text-accent-text">{intro.eyebrow ?? "CATALOG — 6 KATEGORI"}</p>
          <h1 className="display-xl mt-4 text-balance">{intro.headline ?? "Professional Gear, Curated by Need."}</h1>
          <p className="body-lg mt-5 max-w-[56ch] text-muted-foreground">
            {intro.subheadline ??
              "Perangkat yang kami rancang, pasang, dan integrasikan — bukan toko online. Minta penawaran untuk konfigurasi lengkap sesuai kebutuhan ruang Anda."}
          </p>
        </header>

        <MeterDivider annotation="CATALOG" className="mt-8" />

        <div className="mt-10">
          <Suspense fallback={<GridSkeleton />}>
            <CatalogBrowser products={products} categories={cats} solutions={sols} specDefs={specDefs} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
