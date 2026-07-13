import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { GridSkeleton } from "@/components/catalog/GridSkeleton";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbNode, itemListNode } from "@/lib/jsonld";
import { getCatalogProducts, getProductCategories, getSpecDefinitions } from "@/lib/queries/products";
import { getSolutions, getSolutionsForCategory } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";

type Params = { category: string };

export async function generateStaticParams() {
  const categories = await getProductCategories();
  return categories.filter((c) => c.slug).map((c) => ({ category: c.slug! }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const categories = await getProductCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  return buildMetadata({
    title: `${cat.name} — Katalog AV Komersial | ACTA`,
    description:
      cat.description ??
      `Perangkat kategori ${cat.name} yang ACTA rancang, pasang, dan integrasikan. Minta penawaran sesuai kebutuhan project.`,
    path: `/products/c/${category}`,
  });
}

export default async function CategoryLandingPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const [products, categories, solutions, specDefs, relatedSolutions] = await Promise.all([
    getCatalogProducts(),
    getProductCategories(),
    getSolutions(),
    getSpecDefinitions(),
    getSolutionsForCategory(category),
  ]);

  const cat = categories.find((c) => c.slug === category);
  if (!cat || !cat.slug) notFound();

  const cats = categories.filter((c) => c.slug && c.name).map((c) => ({ slug: c.slug!, name: c.name! }));
  const sols = solutions.filter((s) => s.id && s.slug && s.name).map((s) => ({ id: s.id!, slug: s.slug!, name: s.name! }));
  const inCategory = products.filter((p) => p.category_slug === category);

  const jsonLd = [
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Katalog", path: "/products" },
      { name: cat.name ?? category, path: `/products/c/${category}` },
    ]),
    itemListNode(inCategory.filter((p) => p.slug).map((p) => ({ name: p.name ?? p.slug!, path: `/products/${p.slug}` }))),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="container py-section">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Katalog", href: "/products" },
            { name: cat.name ?? category },
          ]}
        />

        <header className="mt-6 max-w-3xl">
          <p className="mono-label text-accent-text">KATEGORI</p>
          <h1 className="display-xl mt-3 text-balance">{cat.name}</h1>
          {cat.description ? (
            <p className="body-lg mt-4 max-w-[56ch] text-muted-foreground">{cat.description}</p>
          ) : null}
        </header>

        {relatedSolutions.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mono-label mr-1 text-muted-foreground">SOLUSI TERKAIT</span>
            {relatedSolutions.map((s) => (
              <Link
                key={s.slug}
                href={`/solutions/${s.slug}`}
                className="mono-label rounded-pill border border-border px-3 py-1 text-foreground transition-colors hover:border-foreground/40 hover:text-accent-text"
              >
                {s.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10">
          <Suspense fallback={<GridSkeleton />}>
            <CatalogBrowser
              products={products}
              categories={cats}
              solutions={sols}
              specDefs={specDefs}
              forcedCategory={category}
              basePath={`/products/c/${category}`}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
