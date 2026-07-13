import Image from "next/image";
import Link from "next/link";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { CompareCheckbox } from "./CompareCheckbox";

export type ProductCardData = {
  slug: string | null;
  name: string | null;
  brand_name: string | null;
  short_spec: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  created_at?: string | null;
  image?: { storage_path: string | null; external_url: string | null } | null;
};

const METER_SEGMENTS = [18, 9, 24, 6];
const NEW_WINDOW_DAYS = 60;

function isRecent(createdAt?: string | null) {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) / 86_400_000 < NEW_WINDOW_DAYS;
}

// Catalog product card (06 §1.5). NEVER renders price. Compact variant (no compare/CTA) is reused on solution detail.
export function ProductCard({
  product,
  className,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  showCompare = false,
  showQuoteCta = false,
  showBadge = false,
}: {
  product: ProductCardData;
  className?: string;
  sizes?: string;
  showCompare?: boolean;
  showQuoteCta?: boolean;
  showBadge?: boolean;
}) {
  const img = mediaUrl(product.image);
  const href = product.slug ? `/products/${product.slug}` : "#";
  const recent = showBadge && isRecent(product.created_at);

  const hasFooter = showCompare || showQuoteCta;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={product.name ?? "Produk"}
        className="flex flex-1 flex-col rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/3] bg-muted">
          {img ? (
            <Image src={img} alt={product.name ?? "Perangkat AV"} fill sizes={sizes} className="object-contain p-5" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="mono-label text-muted-foreground/50">ACTA</span>
            </div>
          )}
          {recent ? (
            <span className="mono-label absolute left-3 top-3 rounded-sm border border-border bg-background/85 px-1.5 py-0.5 text-foreground backdrop-blur-sm">
              BARU
            </span>
          ) : null}
        </div>

        <div className="relative h-0.5 w-full bg-border">
          <div className="absolute inset-y-0 left-0 flex items-stretch gap-[3px]">
            {METER_SEGMENTS.map((w, i) => (
              <span
                key={i}
                className="block h-full bg-primary opacity-35 transition-opacity duration-300 group-hover:opacity-100"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {product.brand_name ? (
            <p className="mono-label text-muted-foreground">{product.brand_name}</p>
          ) : null}
          <h3 className="heading-md mt-1.5 text-foreground transition-colors group-hover:text-accent-text">
            {product.name}
          </h3>
          {product.short_spec ? (
            <p className="mono-spec mt-2 line-clamp-1 text-muted-foreground">{product.short_spec}</p>
          ) : null}
        </div>
      </Link>

      {hasFooter ? (
        <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1">
          {showCompare ? (
            <CompareCheckbox
              item={{
                slug: product.slug ?? "",
                name: product.name,
                brand_name: product.brand_name,
                category_slug: product.category_slug ?? null,
                category_name: product.category_name ?? null,
                image: product.image ?? null,
              }}
            />
          ) : (
            <span />
          )}
          {showQuoteCta ? (
            <WhatsAppCTA
              context="product"
              name={product.name ?? undefined}
              label="Minta Penawaran"
              size="sm"
              buttonVariant="secondary"
              trackContext="card"
              className="shrink-0"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
