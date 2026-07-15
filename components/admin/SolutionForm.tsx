"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AdminSection, Field, inputCls, textareaCls } from "@/components/admin/fields";
import { EntityPicker, type PickerOption } from "@/components/admin/EntityPicker";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { PreviewButton } from "@/components/admin/PreviewButton";
import { saveSolution } from "@/lib/actions/admin/solutions";

type RepeaterItem = Record<string, string>;

export type SolutionFormData = {
  id: string | null;
  name: string;
  slug: string;
  tier: "core" | "supporting";
  value_prop: string;
  hero_headline: string;
  hero_subcopy: string;
  hero_media_id: string | null;
  wa_message: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
  status: "draft" | "published";
  related_product_ids: string[];
  pain_heading: string;
  pain_points: { title: string; body: string; image_url: string }[];
  scope_pillars: { title: string; description: string }[];
};

function Repeater({
  items,
  fields,
  onChange,
  addLabel,
}: {
  items: RepeaterItem[];
  fields: { key: string; label: string; textarea?: boolean }[];
  onChange: (items: RepeaterItem[]) => void;
  addLabel: string;
}) {
  const update = (i: number, key: string, val: string) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it));
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((f) =>
              f.textarea ? (
                <textarea key={f.key} rows={2} placeholder={f.label} className={textareaCls} value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} />
              ) : (
                <input key={f.key} placeholder={f.label} className={inputCls} value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} />
              ),
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, ""]))])}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

export function SolutionForm({
  data,
  products,
  media,
}: {
  data: SolutionFormData;
  products: PickerOption[];
  media: MediaItem[];
}) {
  const router = useRouter();
  const [f, setF] = useState(data);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SolutionFormData>(k: K, v: SolutionFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(status: "draft" | "published") {
    setSaving(true);
    const res = await saveSolution({ ...f, status });
    setSaving(false);
    if (res.ok) {
      toast.success(status === "published" ? "Solution dipublish." : "Solution disimpan.");
      if (!f.id) router.replace(`/admin/solutions/${res.id}`);
      else router.refresh();
      set("id", res.id);
      set("status", status);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{f.id ? "Edit Solution" : "Solution Baru"}</h1>
          <p className="text-sm text-muted-foreground">Status: {f.status}</p>
        </div>
        <div className="flex gap-2">
          {f.id && f.slug ? <PreviewButton path={`/solutions/${f.slug}`} /> : null}
          <button onClick={() => submit("draft")} disabled={saving} className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">
            Simpan Draft
          </button>
          <button onClick={() => submit("published")} disabled={saving} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      <AdminSection title="Dasar">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" required>
            <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Slug" hint="Kosong = auto dari nama. Ubah setelah publish membuat 301.">
            <input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" />
          </Field>
          <Field label="Tier">
            <select className={inputCls} value={f.tier} onChange={(e) => set("tier", e.target.value as "core" | "supporting")}>
              <option value="core">core</option>
              <option value="supporting">supporting</option>
            </select>
          </Field>
          <Field label="Sort order">
            <input type="number" className={inputCls} value={f.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Value prop (one-liner)" required>
          <textarea rows={2} className={textareaCls} value={f.value_prop} onChange={(e) => set("value_prop", e.target.value)} />
        </Field>
      </AdminSection>

      <AdminSection title="Hero">
        <Field label="Hero image" required hint="Foto ruang nyata, bukan product shot.">
          <MediaPicker media={media} value={f.hero_media_id} onChange={(id) => set("hero_media_id", id)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero headline">
            <input className={inputCls} value={f.hero_headline} onChange={(e) => set("hero_headline", e.target.value)} />
          </Field>
          <Field label="WhatsApp message">
            <input className={inputCls} value={f.wa_message} onChange={(e) => set("wa_message", e.target.value)} />
          </Field>
        </div>
        <Field label="Hero subcopy">
          <textarea rows={2} className={textareaCls} value={f.hero_subcopy} onChange={(e) => set("hero_subcopy", e.target.value)} />
        </Field>
      </AdminSection>

      <AdminSection title="Problem that we solve (pain points)" description="Opsional. 3–4 poin dari sudut decision maker. Judul sebaiknya English, deskripsi Indonesia.">
        <Field label="Judul section" hint="Tampil sebagai heading section. Kosong = 'Problem that we solve'.">
          <input className={inputCls} value={f.pain_heading} onChange={(e) => set("pain_heading", e.target.value)} placeholder="Problem that we solve" />
        </Field>
        <Repeater
          items={f.pain_points}
          fields={[
            { key: "title", label: "Judul pain point (English)" },
            { key: "body", label: "Penjelasan (Indonesia)", textarea: true },
            { key: "image_url", label: "URL gambar (https://…) — tampil di carousel" },
          ]}
          onChange={(items) => set("pain_points", items as { title: string; body: string; image_url: string }[])}
          addLabel="Tambah pain point"
        />
      </AdminSection>

      <AdminSection title="Scope of Work (approach)" description="Wajib ≥3 untuk publish.">
        <Repeater
          items={f.scope_pillars}
          fields={[
            { key: "title", label: "Judul pilar" },
            { key: "description", label: "Deskripsi", textarea: true },
          ]}
          onChange={(items) => set("scope_pillars", items as { title: string; description: string }[])}
          addLabel="Tambah pilar"
        />
      </AdminSection>

      <AdminSection title="Related products" description="Dirender di solution detail. Kosong = fallback by kategori.">
        <EntityPicker options={products} value={f.related_product_ids} onChange={(ids) => set("related_product_ids", ids)} placeholder="Cari produk…" />
      </AdminSection>

      <AdminSection title="SEO">
        <Field label="SEO title">
          <input className={inputCls} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
        </Field>
        <Field label="SEO description">
          <textarea rows={2} className={textareaCls} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
        </Field>
      </AdminSection>
    </form>
  );
}
