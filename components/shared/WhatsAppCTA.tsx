"use client";

import { buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { buildWaLink, type WaContext } from "@/lib/wa";
import { cn } from "@/lib/utils";

type WhatsAppCTAProps = {
  context: WaContext;
  name?: string;
  items?: string[];
  message?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  emphasis?: "default" | "orbit";
  buttonVariant?: "whatsapp" | "secondary" | "glass";
  trackContext?: string;
  // When set, a "Minta Penawaran" WA CTA from product/compare also fires quote_request
  // (10-TECH §9 event #3) with the product slug(s), in addition to whatsapp_click.
  quoteSlugs?: string[];
  className?: string;
};

const FACE_SIZE: Record<NonNullable<WhatsAppCTAProps["size"]>, string> = {
  sm: "h-9 px-5 text-sm",
  default: "h-11 px-7 text-[0.95rem]",
  lg: "h-[52px] px-8 text-base",
};

export function WhatsAppCTA({
  context,
  name,
  items,
  message,
  label = "Minta Penawaran",
  size = "default",
  emphasis = "default",
  buttonVariant = "whatsapp",
  trackContext,
  quoteSlugs,
  className,
}: WhatsAppCTAProps) {
  const href = buildWaLink({ context, name, items, message });
  const track = () => {
    trackEvent("whatsapp_click", { context: trackContext ?? context, item: name ?? items?.join(", ") ?? null });
    if (quoteSlugs && quoteSlugs.length > 0) {
      trackEvent("quote_request", { product_slug: quoteSlugs.join(",") });
    }
  };

  if (emphasis === "orbit") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={track}
        className={cn(
          "group relative inline-flex rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        <span aria-hidden className="absolute inset-0 overflow-hidden rounded-pill">
          <span className="absolute inset-0 rounded-pill bg-accent-text/70" />
          <span className="absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 animate-orbit bg-[conic-gradient(from_0deg,transparent_0deg,transparent_205deg,hsl(var(--primary))_285deg,#fff_320deg,transparent_345deg)] motion-reduce:hidden" />
        </span>
        <span
          className={cn(
            "relative z-10 m-[2px] inline-flex items-center justify-center gap-2 rounded-pill bg-primary font-medium text-primary-foreground transition-transform duration-150",
            "shadow-[0_5px_0_-1px_hsl(var(--accent-text)),0_12px_22px_-8px_hsl(var(--accent-text)/0.6)]",
            "group-hover:-translate-y-0.5 group-active:translate-y-[3px] group-active:shadow-[0_2px_0_-1px_hsl(var(--accent-text))]",
            FACE_SIZE[size],
          )}
        >
          <WhatsAppGlyph className="h-4 w-4" />
          {label}
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      className={cn(buttonVariants({ variant: buttonVariant, size }), className)}
    >
      <WhatsAppGlyph className="h-4 w-4" />
      {label}
    </a>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.6 4.42c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.42 1.03 2.59.13.16 1.77 2.71 4.29 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.36-.76-1.86-.2-.48-.4-.42-.55-.42l-.48-.01Z" />
    </svg>
  );
}
