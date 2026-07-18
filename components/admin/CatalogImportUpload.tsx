"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadCatalog } from "@/lib/actions/admin/catalog-pipeline";

export function CatalogImportUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Pilih file .xlsx atau .csv dulu.");
      return;
    }
    setBusy(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadCatalog(formData);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("File berhasil diparsing.");
    router.push(`/admin/catalog-import/${res.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
      />
      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Memproses…" : "Upload & Parse"}
      </button>
    </form>
  );
}
