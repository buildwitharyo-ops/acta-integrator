"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string; annotation?: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-muted">
        <span className="mono-label text-muted-foreground/50">ACTA</span>
      </div>
    );
  }

  return (
    <div>
      <Dialog onOpenChange={(o) => !o && setZoomed(false)}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Perbesar foto"
          >
            <Image
              src={current.url}
              alt={current.alt || productName}
              fill
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {current.annotation ? (
              <span className="mono-spec absolute left-4 top-4 rounded-md bg-background/80 px-2 py-1 text-foreground ring-1 ring-border backdrop-blur-md">
                {current.annotation}
              </span>
            ) : null}
            <span className="mono-label absolute bottom-4 right-4 rounded-md bg-background/80 px-2 py-1 text-muted-foreground ring-1 ring-border backdrop-blur-md">
              PERBESAR
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl border-border bg-background p-0">
          <DialogTitle className="sr-only">{current.alt || productName}</DialogTitle>
          <div className="relative aspect-[4/3] w-full overflow-auto">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Perkecil" : "Perbesar"}
              className="relative block h-full w-full cursor-zoom-in"
            >
              <Image
                src={current.url}
                alt={current.alt || productName}
                fill
                sizes="90vw"
                className={cn(
                  "object-contain p-8 transition-transform duration-300",
                  zoomed && "scale-[2.3] cursor-zoom-out",
                )}
              />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted transition-colors",
                i === active ? "border-primary" : "border-border hover:border-foreground/40",
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
