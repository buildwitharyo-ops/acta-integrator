import type { Metadata } from "next";
import Link from "next/link";
import { CompareTable } from "@/components/catalog/CompareTable";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getCompareData } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Bandingkan Produk | ACTA",
  robots: { index: false, follow: false },
};

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono-spec mt-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
      {children}
    </p>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const sp = await searchParams;
  const dedup = [...new Set((sp.items ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  const truncated = dedup.length > 4;
  const requested = dedup.slice(0, 4);

  const { products, specDefsByCategory } = requested.length
    ? await getCompareData(requested)
    : { products: [], specDefsByCategory: {} };

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const ordered = requested.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const droppedCount = requested.length - ordered.length;

  const catOrder: string[] = [];
  const byCat: Record<string, typeof ordered> = {};
  for (const p of ordered) {
    const c = p.category_slug ?? "lainnya";
    if (!byCat[c]) {
      byCat[c] = [];
      catOrder.push(c);
    }
    byCat[c]!.push(p);
  }

  const singleCategory = catOrder.length === 1 && ordered.length >= 2;
  const crossCategory = catOrder.length > 1;

  return (
    <section className="container py-section">
      <p className="mono-label text-accent-text">BANDINGKAN</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="display-lg">Bandingkan Produk</h1>
        <Link href="/products" className="mono-label text-muted-foreground transition-colors hover:text-foreground">
          ← Kembali ke Katalog
        </Link>
      </div>

      {truncated ? <Banner>Hanya 4 produk pertama yang ditampilkan dalam perbandingan.</Banner> : null}
      {droppedCount > 0 ? (
        <Banner>{droppedCount} produk tidak tersedia dan dihapus dari perbandingan.</Banner>
      ) : null}

      {ordered.length < 2 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-14 text-center">
          <p className="heading-md">Pilih minimal 2 produk sekategori untuk dibandingkan</p>
          <p className="body-sm mt-2 text-muted-foreground">
            Tambahkan produk lewat kotak “Bandingkan” di katalog.
          </p>
          {ordered[0] ? (
            <div className="mx-auto mt-8 max-w-xs text-left">
              <ProductCard product={ordered[0]} showQuoteCta />
              <p className="body-sm mt-3 text-center text-muted-foreground">
                Tambahkan pembanding dari kategori {ordered[0].category_name ?? ordered[0].category_slug}.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex h-11 items-center rounded-pill bg-primary px-7 text-sm font-medium text-primary-foreground"
              >
                Telusuri Katalog
              </Link>
            </div>
          )}
        </div>
      ) : crossCategory ? (
        <div className="mt-8">
          <div className="rounded-lg border border-border bg-muted/40 p-5">
            <p className="heading-md">Perbandingan hanya untuk produk dalam kategori yang sama</p>
            <p className="body-sm mt-2 text-muted-foreground">
              {ordered
                .map((p) => `${p.name} (${p.category_name ?? p.category_slug})`)
                .join(", ")}
              . Spec antar-kategori tidak sebanding baris-per-baris.
            </p>
          </div>
          <div className="mt-8 space-y-10">
            {catOrder.map((cat) => {
              const group = byCat[cat]!;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="mono-label text-foreground">{group[0]?.category_name ?? cat}</p>
                    {group.length >= 2 ? (
                      <Link
                        href={`/products/compare?items=${group.map((p) => p.slug).join(",")}`}
                        className="mono-label text-accent-text transition-colors hover:text-foreground"
                      >
                        Bandingkan grup ini →
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {group.map((p) => (
                      <ProductCard key={p.id ?? p.slug} product={p} showQuoteCta />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : singleCategory ? (
        <div className="mt-8">
          <CompareTable products={ordered} specDefs={specDefsByCategory[catOrder[0]!] ?? []} />
        </div>
      ) : null}
    </section>
  );
}
