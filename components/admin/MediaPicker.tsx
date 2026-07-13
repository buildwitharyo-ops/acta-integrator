"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  storage_path: string | null;
  external_url: string | null;
  alt: string | null;
  is_placeholder: boolean | null;
};

export function MediaPicker({
  media,
  value,
  onChange,
}: {
  media: MediaItem[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = media.find((m) => m.id === value) ?? null;
  const selectedUrl = mediaUrl(selected);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {selectedUrl ? (
          <Image src={selectedUrl} alt={selected?.alt ?? ""} fill sizes="96px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Kosong</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted">
            {selected ? "Ganti" : "Pilih media"}
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Pilih Media</DialogTitle>
            </DialogHeader>
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {media.map((m) => {
                const url = mediaUrl(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted text-left transition-colors",
                      m.id === value ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/40",
                    )}
                  >
                    {url ? <Image src={url} alt={m.alt ?? ""} fill sizes="200px" className="object-cover" /> : null}
                    {m.is_placeholder ? (
                      <span className="absolute left-1 top-1 rounded bg-background/85 px-1 text-[9px] font-medium text-muted-foreground">
                        PLACEHOLDER
                      </span>
                    ) : null}
                    {!m.alt ? (
                      <span className="absolute bottom-1 left-1 rounded bg-destructive/90 px-1 text-[9px] text-white">no alt</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
        {selected ? (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-muted-foreground hover:text-destructive">
            Hapus
          </button>
        ) : null}
      </div>
    </div>
  );
}
