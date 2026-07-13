"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { EntityPicker, type PickerOption } from "@/components/admin/EntityPicker";
import { AdminSection, Field, inputCls, textareaCls } from "@/components/admin/fields";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { PreviewButton } from "@/components/admin/PreviewButton";
import { saveArticle } from "@/lib/actions/admin/articles";

export type ArticleFormData = {
  id: string | null;
  type: "news" | "learn";
  title: string;
  slug: string;
  excerpt: string;
  cover_media_id: string | null;
  body: unknown;
  category_id: string;
  level: "" | "dasar" | "menengah";
  author_id: string;
  tags: string[];
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  status: "draft" | "scheduled" | "published";
  scheduled_at: string;
  related_product_ids: string[];
  related_solution_ids: string[];
};

type ArticleCategory = { id: string; type: string; name: string };

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ArticleForm({
  data,
  authors,
  categories,
  products,
  solutions,
  media,
  initialScheduledIso = null,
}: {
  data: ArticleFormData;
  authors: PickerOption[];
  categories: ArticleCategory[];
  products: PickerOption[];
  solutions: PickerOption[];
  media: MediaItem[];
  initialScheduledIso?: string | null;
}) {
  const router = useRouter();
  const [f, setF] = useState<ArticleFormData>(data);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ArticleFormData>(k: K, v: ArticleFormData[K]) => setF((s) => ({ ...s, [k]: v }));

  // Convert stored UTC schedule → the admin's local datetime-local value on the client only
  // (server RSC can't know the browser TZ; doing it here avoids a hydration mismatch).
  useEffect(() => {
    if (initialScheduledIso) setF((s) => (s.scheduled_at ? s : { ...s, scheduled_at: toDatetimeLocal(initialScheduledIso) }));
  }, [initialScheduledIso]);

  const typeCategories = categories.filter((c) => c.type === f.type);

  async function submit(status: ArticleFormData["status"]) {
    setSaving(true);
    const res = await saveArticle({
      id: f.id,
      type: f.type,
      title: f.title,
      slug: f.slug,
      excerpt: f.excerpt,
      cover_media_id: f.cover_media_id ?? "",
      body: f.body,
      category_id: f.category_id,
      level: f.level,
      author_id: f.author_id,
      tags: f.tags,
      is_featured: f.is_featured,
      seo_title: f.seo_title,
      seo_description: f.seo_description,
      status,
      // datetime-local is TZ-naive; interpret it in the browser's TZ, send unambiguous UTC ISO.
      scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
      related_product_ids: f.related_product_ids,
      related_solution_ids: f.related_solution_ids,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(status === "published" ? "Artikel dipublish." : status === "scheduled" ? "Artikel dijadwalkan." : "Draft tersimpan.");
    if (!f.id) router.replace(`/admin/articles/${res.id}`);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">{f.type}</span>
          <h1 className="mt-1 text-xl font-semibold">{f.id ? "Edit artikel" : "Artikel baru"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {f.id && f.slug ? <PreviewButton path={`/${f.type}/${f.slug}`} /> : null}
          <button type="button" disabled={saving} onClick={() => submit("draft")} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">Simpan draft</button>
          <button type="button" disabled={saving} onClick={() => submit("scheduled")} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">Jadwalkan</button>
          <button type="button" disabled={saving} onClick={() => submit("published")} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60">Publish</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <AdminSection title="Konten">
            <Field label="Judul" required><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Slug" hint="Kosongkan untuk auto dari judul. Unik per tipe."><input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" /></Field>
            <Field label="Excerpt" required hint={`${f.excerpt.length}/160 — dipakai di card & meta description`} error={f.excerpt.length > 160 ? "Maksimal 160 karakter." : undefined}>
              <textarea rows={2} className={textareaCls} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </Field>
            <Field label="Body">
              <ArticleEditor content={f.body} onChange={(doc) => set("body", doc)} media={media} />
            </Field>
          </AdminSection>

          <AdminSection title="Konten terkait">
            <Field label="Produk terkait" hint="Maksimal 4 — link balik ke Catalog.">
              <EntityPicker options={products} value={f.related_product_ids} onChange={(ids) => set("related_product_ids", ids)} max={4} placeholder="Cari produk…" />
            </Field>
            <Field label="Solusi terkait">
              <EntityPicker options={solutions} value={f.related_solution_ids} onChange={(ids) => set("related_solution_ids", ids)} placeholder="Cari solusi…" />
            </Field>
          </AdminSection>

          <AdminSection title="SEO (opsional)">
            <Field label="SEO title"><input className={inputCls} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} /></Field>
            <Field label="SEO description"><textarea rows={2} className={textareaCls} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></Field>
          </AdminSection>
        </div>

        <aside className="space-y-6">
          <AdminSection title="Publikasi">
            <div className="text-xs text-muted-foreground">
              Status saat ini: <span className="font-medium text-foreground">{f.status}</span>
            </div>
            <Field label="Jadwal (untuk 'Jadwalkan')" hint="Harus di masa depan.">
              <input type="datetime-local" className={inputCls} value={f.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="h-4 w-4 rounded border-border" />
              Featured (sorot di hub)
            </label>
          </AdminSection>

          <AdminSection title="Cover" description="Wajib + alt terisi sebelum publish.">
            <MediaPicker media={media} value={f.cover_media_id} onChange={(id) => set("cover_media_id", id)} />
          </AdminSection>

          <AdminSection title="Taksonomi">
            <Field label="Kategori">
              <select className={inputCls} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">— pilih —</option>
                {typeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            {f.type === "learn" ? (
              <Field label="Level">
                <select className={inputCls} value={f.level} onChange={(e) => set("level", e.target.value as ArticleFormData["level"])}>
                  <option value="">— pilih —</option>
                  <option value="dasar">Dasar</option>
                  <option value="menengah">Menengah</option>
                </select>
              </Field>
            ) : null}
            <Field label="Author" required>
              <select className={inputCls} value={f.author_id} onChange={(e) => set("author_id", e.target.value)}>
                <option value="">— pilih —</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.label}{a.sublabel ? ` · ${a.sublabel}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="Pisahkan dengan koma.">
              <input className={inputCls} value={f.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
            </Field>
          </AdminSection>
        </aside>
      </div>
    </div>
  );
}
