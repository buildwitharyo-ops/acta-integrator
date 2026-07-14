"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { trackEvent } from "@/lib/analytics";
import { mediaUrl } from "@/lib/media";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { COMPARE_MAX, useCompare } from "./CompareProvider";

export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // On the compare page the URL drives the table; a second (context-driven) control would desync it.
  const onComparePage = pathname === "/products/compare";
  const canCompare = items.length >= 2;
  const categoryLabel = items[0]?.product_type_name ?? items[0]?.product_type_slug ?? "";

  const goCompare = () => {
    const slugs = items.map((i) => i.slug).filter(Boolean);
    if (slugs.length < 2) return;
    trackEvent("compare_view", { slugs });
    router.push(`/products/compare?items=${slugs.join(",")}`);
  };

  return (
    <AnimatePresence>
      {items.length > 0 && !onComparePage ? (
        <motion.div
          role="region"
          aria-label="Perbandingan produk"
          initial={reduce ? false : { y: "110%" }}
          animate={{ y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "110%" }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
        >
          <div aria-hidden className="relative h-0.5 w-full bg-border">
            <div className="absolute inset-y-0 left-0 flex items-stretch gap-[3px]">
              {[20, 8, 26, 6].map((w, i) => (
                <span key={i} className="block h-full bg-primary" style={{ width: `${w}px` }} />
              ))}
            </div>
          </div>

          <div className="container flex items-center gap-3 py-3 sm:gap-5">
            <p aria-live="polite" className="mono-label shrink-0 text-foreground">
              BANDINGKAN
              {categoryLabel ? <span className="hidden sm:inline"> — {categoryLabel.toUpperCase()}</span> : null}{" "}
              <span className="text-muted-foreground">
                ({items.length}/{COMPARE_MAX})
              </span>
            </p>

            <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {items.map((it) => {
                const img = mediaUrl(it.image);
                return (
                  <li key={it.slug} className="relative shrink-0">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {img ? (
                        <Image src={img} alt={it.name ?? "Produk"} width={48} height={48} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="mono-label text-[9px] text-muted-foreground/60">ACTA</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(it.slug)}
                      aria-label={`Hapus ${it.name ?? "produk"} dari perbandingan`}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                        <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={clear}
                className="caption hidden text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:inline"
              >
                Hapus semua
              </button>
              <button
                type="button"
                onClick={goCompare}
                disabled={!canCompare}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform",
                  "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                Bandingkan ({items.length})
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
