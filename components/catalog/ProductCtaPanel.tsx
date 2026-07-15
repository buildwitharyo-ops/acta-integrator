"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm } from "@/components/shared/LeadForm";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { trackEvent } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { useCompare } from "./CompareProvider";

export function ProductCtaPanel({
  productName,
  brandName,
  slug,
  claim,
}: {
  productName: string;
  brandName?: string | null;
  slug: string;
  claim?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { items } = useCompare();
  const trayOpen = items.length > 0;
  const url = `${SITE_URL}/products/${slug}`;
  const waMessage = `Halo ACTA, saya ingin minta penawaran untuk ${productName}${brandName ? ` (${brandName})` : ""}. Sumber: ${url}`;
  const microcopy = claim ?? "Tim engineering ACTA akan menghubungi Anda.";

  const formButton = (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        trackEvent("cta_click", { context: "product_form", slug });
      }}
      className="inline-flex h-11 w-full items-center justify-center rounded-pill px-6 text-[0.95rem] font-medium text-foreground ring-1 ring-inset ring-border transition-colors hover:bg-card"
    >
      Kirim via Form
    </button>
  );

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
          <p className="mono-label text-accent-text">MINTA PENAWARAN</p>
          <p className="body-sm mt-2 text-muted-foreground">
            Harga mengikuti konfigurasi & kebutuhan project. Tim kami bantu susun penawaran.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <WhatsAppCTA
              context="product"
              name={productName}
              message={waMessage}
              label="Minta Penawaran"
              emphasis="orbit"
              size="lg"
              trackContext="detail"
              className="w-full [&>span]:w-full"
            />
            {formButton}
          </div>
          <p className="mono-spec mt-4 text-muted-foreground">{microcopy}</p>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md transition-[bottom] lg:hidden",
          trayOpen ? "bottom-[76px]" : "bottom-0",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <WhatsAppCTA
              context="product"
              name={productName}
              message={waMessage}
              label="Minta Penawaran"
              size="default"
              trackContext="detail"
              className="w-full"
            />
          </div>
          <div className="w-32">{formButton}</div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Minta Penawaran — {productName}</DialogTitle>
          </DialogHeader>
          <LeadForm formType="quote_form" productSlug={slug} />
        </DialogContent>
      </Dialog>
    </>
  );
}
