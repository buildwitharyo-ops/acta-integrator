"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/fields";
import { ProductForm, type ProductFormData, type ProductType, type SpecDef } from "@/components/admin/ProductForm";
import type { PickerOption } from "@/components/admin/EntityPicker";
import type { MediaItem } from "@/components/admin/MediaPicker";
import { Badge } from "@/components/ui/badge";
import { linkApprovedDraft, rejectDraft } from "@/lib/actions/admin/catalog-pipeline";
import type { DraftSpec, ProposedImage } from "@/lib/catalog-pipeline/types";

const CONFIDENCE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  tinggi: "default",
  sedang: "secondary",
  rendah: "destructive",
};

export function CatalogReviewPanel({
  importId,
  draftId,
  draft,
  brandMatched,
  brandRaw,
  unmatchedSpecs,
  proposedImages,
  formData,
  brands,
  categories,
  productTypes,
  specDefs,
  solutions,
  products,
  media,
}: {
  importId: string;
  draftId: string;
  draft: {
    confidence: string;
    confidence_notes: string | null;
    status_recommendation: string;
    skip_reason: string | null;
    name_correction: string | null;
    new_product_type_name: string | null;
  };
  brandMatched: boolean;
  brandRaw: string;
  unmatchedSpecs: DraftSpec[];
  proposedImages: ProposedImage[];
  formData: ProductFormData;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  productTypes: ProductType[];
  specDefs: SpecDef[];
  solutions: PickerOption[];
  products: PickerOption[];
  media: MediaItem[];
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSaved(result: { id: string; status: "draft" | "published" }) {
    await linkApprovedDraft(draftId, result.id);
    toast.success("Draft ditautkan ke produk — produk sekarang di /admin/products.");
    router.push(`/admin/catalog-import/${importId}`);
  }

  async function handleReject() {
    setBusy(true);
    const res = await rejectDraft(draftId, reason.trim() || "Ditolak tanpa alasan spesifik.");
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Draft ditolak.");
    router.push(`/admin/catalog-import/${importId}`);
  }

  return (
    <div className="grid gap-6 pb-16 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <AdminSection title="Hasil riset AI (baca saja)">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={CONFIDENCE_VARIANT[draft.confidence] ?? "secondary"}>Confidence: {draft.confidence}</Badge>
            <Badge variant="outline">Rekomendasi: {draft.status_recommendation}</Badge>
          </div>
          {draft.confidence_notes ? <p className="text-xs text-muted-foreground">{draft.confidence_notes}</p> : null}
          {draft.skip_reason ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Skip reason: {draft.skip_reason}
            </p>
          ) : null}
          {draft.name_correction ? (
            <p className="text-xs text-muted-foreground">Koreksi nama dari AI: <span className="font-medium text-foreground">{draft.name_correction}</span></p>
          ) : null}

          {!brandMatched ? (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              ⚠ Brand &quot;{brandRaw}&quot; belum ada di katalog — buat dulu di{" "}
              <a href="/admin/categories" target="_blank" className="font-medium text-accent-text hover:underline">
                Categories &amp; Specs ↗
              </a>
              , lalu refresh halaman ini dan pilih brand-nya di form kanan.
            </p>
          ) : null}

          {draft.new_product_type_name ? (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              ⚠ AI mengusulkan product type baru: <span className="font-medium text-foreground">&quot;{draft.new_product_type_name}&quot;</span> — belum
              ada di katalog. Buat dulu di{" "}
              <a href="/admin/categories" target="_blank" className="font-medium text-accent-text hover:underline">
                Categories &amp; Specs ↗
              </a>{" "}
              (termasuk spec definitions-nya), lalu refresh halaman ini supaya spec di bawah bisa dipetakan otomatis.
            </p>
          ) : null}
        </AdminSection>

        {unmatchedSpecs.length > 0 ? (
          <AdminSection title={`Spec belum terpetakan (${unmatchedSpecs.length})`} description="Belum ada spec definition yang cocok di product type ini — tambahkan definition-nya dulu (Categories & Specs) kalau mau dipakai, atau isi manual di tab Spesifikasi.">
            <ul className="space-y-1.5 text-xs">
              {unmatchedSpecs.map((s) => (
                <li key={s.key} className="flex justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0">
                  <span className="text-muted-foreground">{s.label} ({s.key})</span>
                  <span className="font-medium">{s.value_text}{s.unit ? ` ${s.unit}` : ""}</span>
                </li>
              ))}
            </ul>
          </AdminSection>
        ) : null}

        <AdminSection
          title={`Gambar usulan AI (${proposedImages.length})`}
          description="Background dihapus otomatis (remove.bg) di background — begitu selesai, otomatis masuk tab Gallery di kanan. Sumber asli tetap bisa dicek di sini."
        >
          {proposedImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada gambar terverifikasi dari riset.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {proposedImages.map((img, i) => (
                <li key={i} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                  <a href={img.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-accent-text hover:underline">
                    {img.angle_note || img.url}
                  </a>
                  <ImageStatusBadge img={img} />
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Tolak draft ini">
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan (opsional)…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => (rejecting ? handleReject() : setRejecting(true))}
            disabled={busy}
            className="mt-2 h-9 rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            {rejecting ? "Konfirmasi Tolak" : "Tolak Draft"}
          </button>
        </AdminSection>
      </div>

      <ProductForm
        data={formData}
        brands={brands}
        categories={categories}
        productTypes={productTypes}
        specDefs={specDefs}
        solutions={solutions}
        products={products}
        media={media}
        onSaved={handleSaved}
      />
    </div>
  );
}

function ImageStatusBadge({ img }: { img: ProposedImage }) {
  if (img.committed_media_id) return <Badge variant="default">Di Gallery ✓</Badge>;
  if (img.status === "failed") return <Badge variant="destructive" title={img.fail_reason}>Gagal</Badge>;
  if (img.status === "ok") return <Badge variant="secondary">Menyalin ke Gallery…</Badge>;
  if (img.status === "processing") return <Badge variant="secondary">Diproses…</Badge>;
  return <Badge variant="outline">Antre</Badge>;
}
