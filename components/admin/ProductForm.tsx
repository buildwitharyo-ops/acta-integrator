"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { AdminSection, Field, inputCls, textareaCls } from "@/components/admin/fields";
import { EntityPicker, type PickerOption } from "@/components/admin/EntityPicker";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { PreviewButton } from "@/components/admin/PreviewButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveProduct } from "@/lib/actions/admin/products";
import { mediaUrl } from "@/lib/media";

export type SpecDef = {
  id: string;
  product_type_id: string | null;
  key: string;
  label: string;
  spec_group: string;
  data_type: string;
  unit: string | null;
  enum_options: string[] | null;
  sort_order: number;
};

export type ProductType = { id: string; category_id: string; name: string };

export type ProductFormData = {
  id: string | null;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  product_type_id: string;
  short_spec: string;
  description_md: string;
  suitable_for: string;
  spec_source_url: string;
  internal_price: string;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published";
  images: { media_id: string; image_annotation: string }[];
  spec_inputs: Record<string, string>;
  related_solution_ids: string[];
  similar_product_ids: string[];
};

export function ProductForm({
  data,
  brands,
  categories,
  productTypes,
  specDefs,
  solutions,
  products,
  media,
}: {
  data: ProductFormData;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  productTypes: ProductType[];
  specDefs: SpecDef[];
  solutions: PickerOption[];
  products: PickerOption[];
  media: MediaItem[];
}) {
  const router = useRouter();
  const [f, setF] = useState(data);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProductFormData>(k: K, val: ProductFormData[K]) => setF((p) => ({ ...p, [k]: val }));

  const typesInCategory = useMemo(
    () => productTypes.filter((t) => t.category_id === f.category_id),
    [productTypes, f.category_id],
  );

  function setCategory(categoryId: string) {
    setF((p) => {
      // Product type is category-scoped — clear it when it no longer belongs to the new category.
      const stillValid = productTypes.some((t) => t.id === p.product_type_id && t.category_id === categoryId);
      return { ...p, category_id: categoryId, product_type_id: stillValid ? p.product_type_id : "" };
    });
  }

  const typeSpecs = useMemo(
    () => specDefs.filter((d) => d.product_type_id === f.product_type_id).sort((a, b) => a.sort_order - b.sort_order),
    [specDefs, f.product_type_id],
  );
  const specGroups = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, SpecDef[]> = {};
    for (const d of typeSpecs) {
      if (!map[d.spec_group]) { map[d.spec_group] = []; order.push(d.spec_group); }
      map[d.spec_group]!.push(d);
    }
    return order.map((g) => ({ group: g, defs: map[g]! }));
  }, [typeSpecs]);

  const similarInCategory = useMemo(() => {
    // caller passes products already restricted to same category via options; keep all here
    return products.filter((p) => p.id !== f.id);
  }, [products, f.id]);

  function buildSpecValues() {
    const out: { spec_definition_id: string; value_text: string; value_number: number | null; value_boolean: boolean | null; value_options: string[] | null }[] = [];
    for (const d of typeSpecs) {
      const raw = (f.spec_inputs[d.id] ?? "").trim();
      if (!raw) continue;
      if (d.data_type === "number") out.push({ spec_definition_id: d.id, value_text: raw, value_number: Number(raw), value_boolean: null, value_options: null });
      else if (d.data_type === "boolean") out.push({ spec_definition_id: d.id, value_text: raw, value_number: null, value_boolean: raw === "true", value_options: null });
      else if (d.data_type === "enum") out.push({ spec_definition_id: d.id, value_text: raw, value_number: null, value_boolean: null, value_options: [raw] });
      else out.push({ spec_definition_id: d.id, value_text: raw, value_number: null, value_boolean: null, value_options: null });
    }
    return out;
  }

  const specCount = useMemo(() => typeSpecs.filter((d) => (f.spec_inputs[d.id] ?? "").trim()).length, [typeSpecs, f.spec_inputs]);

  async function submit(status: "draft" | "published") {
    setSaving(true);
    const res = await saveProduct({
      ...f,
      status,
      images: f.images,
      spec_values: buildSpecValues(),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(status === "published" ? "Produk dipublish." : "Produk disimpan.");
      if (!f.id) router.replace(`/admin/products/${res.id}`);
      else router.refresh();
      set("id", res.id);
      set("status", status);
    } else {
      toast.error(res.error);
    }
  }

  const moveImage = (i: number, dir: -1 | 1) => {
    const next = [...f.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    set("images", next);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{f.id ? "Edit Produk" : "Produk Baru"}</h1>
          <p className="text-sm text-muted-foreground">Status: {f.status}</p>
        </div>
        <div className="flex gap-2">
          {f.id && f.slug ? <PreviewButton path={`/products/${f.slug}`} /> : null}
          <button onClick={() => submit("draft")} disabled={saving} className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">
            Simpan Draft
          </button>
          <button onClick={() => submit("published")} disabled={saving} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({f.images.length})</TabsTrigger>
          <TabsTrigger value="specs">Spesifikasi ({specCount})</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-6">
          <AdminSection title="Info dasar">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama" required>
                <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Slug" hint="Kosong = auto. Ubah setelah publish membuat 301.">
                <input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" />
              </Field>
              <Field label="Brand" required>
                <select className={inputCls} value={f.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                  <option value="">— pilih —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Kategori" required>
                <select className={inputCls} value={f.category_id} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">— pilih —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Product Type" required hint="Menentukan template spec. Pilih kategori dulu.">
                <select className={inputCls} value={f.product_type_id} disabled={!f.category_id} onChange={(e) => set("product_type_id", e.target.value)}>
                  <option value="">— pilih —</option>
                  {typesInCategory.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Short spec" required hint="≤80 char. Teaser 1 baris di card.">
              <input maxLength={80} className={inputCls} value={f.short_spec} onChange={(e) => set("short_spec", e.target.value)} />
            </Field>
            <Field label="Cocok untuk">
              <input className={inputCls} value={f.suitable_for} onChange={(e) => set("suitable_for", e.target.value)} />
            </Field>
            <Field label="Deskripsi">
              <textarea rows={3} className={textareaCls} value={f.description_md} onChange={(e) => set("description_md", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sumber spec (URL)">
                <input className={inputCls} value={f.spec_source_url} onChange={(e) => set("spec_source_url", e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Internal price">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent-text">INTERNAL</span>
                  <input type="number" className={inputCls} value={f.internal_price} onChange={(e) => set("internal_price", e.target.value)} />
                </div>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Never public — difilter di view publik (09-DATA-SCHEMA).</p>
          </AdminSection>

          <AdminSection title="Relasi">
            <Field label="Solusi terkait">
              <EntityPicker options={solutions} value={f.related_solution_ids} onChange={(ids) => set("related_solution_ids", ids)} placeholder="Cari solusi…" />
            </Field>
            <Field label="Unit serupa (maks 4, sekategori)" hint="Kosong = fallback otomatis.">
              <EntityPicker options={similarInCategory} value={f.similar_product_ids} onChange={(ids) => set("similar_product_ids", ids)} placeholder="Cari produk…" max={4} />
            </Field>
          </AdminSection>

          <AdminSection title="SEO">
            <Field label="SEO title">
              <input className={inputCls} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </Field>
            <Field label="SEO description">
              <textarea rows={2} className={textareaCls} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
            </Field>
          </AdminSection>
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <AdminSection title="Gallery" description="Foto pertama = foto utama/OG. Alt & is_placeholder diatur di modul Media.">
            {f.images.length > 0 ? (
              <ul className="space-y-2">
                {f.images.map((img, i) => {
                  const m = media.find((x) => x.id === img.media_id);
                  const url = mediaUrl(m);
                  return (
                    <li key={img.media_id} className="flex items-center gap-3 rounded-md border border-border p-2">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
                        {url ? <Image src={url} alt="" fill sizes="80px" className="object-cover" /> : null}
                      </div>
                      <input
                        placeholder="Anotasi (mis. P3.9)"
                        className={inputCls}
                        value={img.image_annotation}
                        onChange={(e) => set("images", f.images.map((x, idx) => (idx === i ? { ...x, image_annotation: e.target.value } : x)))}
                      />
                      {i === 0 ? <span className="shrink-0 text-[10px] font-medium text-accent-text">UTAMA</span> : null}
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === f.images.length - 1} className="text-muted-foreground disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => set("images", f.images.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada foto.</p>
            )}
            <div className="mt-3">
              <MediaPicker
                media={media.filter((m) => !f.images.some((im) => im.media_id === m.id))}
                value={null}
                onChange={(id) => {
                  if (id) set("images", [...f.images, { media_id: id, image_annotation: "" }]);
                }}
              />
            </div>
          </AdminSection>
        </TabsContent>

        <TabsContent value="specs" className="mt-4">
          <AdminSection title="Spesifikasi" description={f.product_type_id ? "Dari template product type. Kosong = tidak dirender." : "Pilih kategori & product type dulu di tab Info."}>
            {specGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {f.product_type_id ? "Tidak ada template spec untuk product type ini." : "Pilih Product Type di tab Info untuk melihat field spesifikasi."}
              </p>
            ) : (
              specGroups.map(({ group, defs }) => (
                <div key={group} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                  {defs.map((d) => (
                    <Field key={d.id} label={d.label} hint={d.unit ? `unit: ${d.unit}` : undefined}>
                      {d.data_type === "boolean" ? (
                        <select className={inputCls} value={f.spec_inputs[d.id] ?? ""} onChange={(e) => set("spec_inputs", { ...f.spec_inputs, [d.id]: e.target.value })}>
                          <option value="">—</option>
                          <option value="true">Ya</option>
                          <option value="false">Tidak</option>
                        </select>
                      ) : d.data_type === "enum" ? (
                        <select className={inputCls} value={f.spec_inputs[d.id] ?? ""} onChange={(e) => set("spec_inputs", { ...f.spec_inputs, [d.id]: e.target.value })}>
                          <option value="">—</option>
                          {(d.enum_options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={d.data_type === "number" ? "number" : "text"}
                          className={inputCls}
                          value={f.spec_inputs[d.id] ?? ""}
                          onChange={(e) => set("spec_inputs", { ...f.spec_inputs, [d.id]: e.target.value })}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              ))
            )}
          </AdminSection>
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <AdminSection title="Guardrail publish" description="Semua wajib untuk publish.">
            <ul className="space-y-2 text-sm">
              <GuardItem ok={Boolean(f.category_id)}>Kategori terisi</GuardItem>
              <GuardItem ok={Boolean(f.product_type_id)}>Product Type terisi</GuardItem>
              <GuardItem ok={Boolean(f.short_spec.trim())}>Short spec terisi</GuardItem>
              <GuardItem ok={f.images.length >= 1}>Minimal 1 foto</GuardItem>
              <GuardItem ok={specCount >= 3}>Minimal 3 spec values (sekarang {specCount})</GuardItem>
            </ul>
            {media.some((m) => f.images.some((im) => im.media_id === m.id) && m.is_placeholder) ? (
              <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                ⚠ Masih ada foto placeholder (TO-REPLACE) — boleh publish, tapi ganti sebelum diklaim.
              </p>
            ) : null}
          </AdminSection>
        </TabsContent>
      </Tabs>
    </form>
  );
}

function GuardItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-status-text" : "text-muted-foreground"}>{ok ? "✓" : "○"}</span>
      <span className={ok ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
