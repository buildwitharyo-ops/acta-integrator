import { z } from "zod";

// Canonical page-section registry (09 §4.2). This is the single source of truth for BOTH
// the admin editor UI (field descriptors) and server-side validation (Zod, derived below).
// It is NOT a page builder: the set of pages + section keys is fixed here; admins can only
// edit the fields of known sections. Media refs use the `_media_id` suffix convention (09 §4.2).

export type FieldType = "text" | "textarea" | "media" | "link" | "linkLabel" | "repeater" | "categoryProducts";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  rows?: number; // textarea height
  max?: number; // repeater cap
  itemLabel?: string; // repeater item noun
  fields?: FieldDef[]; // repeater subfields (scalar only: text/textarea/media)
};

// ── Shared payload shapes (registry notes several sections share a payload) ──────────────
const TRUST_LOGOS: FieldDef[] = [
  { key: "label", label: "Label", type: "text" },
  {
    key: "logos",
    label: "Logo",
    type: "repeater",
    itemLabel: "Logo",
    hint: "Kosongkan SVG → fallback wordmark tipografis.",
    fields: [
      { key: "name", label: "Nama", type: "text" },
      { key: "svg_media_id", label: "Logo (SVG)", type: "media" },
      { key: "url", label: "URL (opsional)", type: "text" },
    ],
  },
];

const STEPS: FieldDef[] = [
  { key: "headline", label: "Headline", type: "text" },
  {
    key: "steps",
    label: "Langkah / Pilar",
    type: "repeater",
    itemLabel: "Langkah",
    max: 4,
    fields: [
      { key: "no", label: "No", type: "text" },
      { key: "title", label: "Judul", type: "text" },
      { key: "description", label: "Deskripsi", type: "textarea", rows: 2 },
    ],
  },
];

const INTRO: FieldDef[] = [
  { key: "eyebrow", label: "Eyebrow", type: "text" },
  { key: "headline", label: "Headline", type: "text" },
  { key: "subheadline", label: "Subheadline", type: "textarea", rows: 2 },
];

// ── Fields per section_key (section_key is unique across pages except `intro`) ────────────
export const SECTION_FIELDS: Record<string, FieldDef[]> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "headline_1", label: "Headline baris 1", type: "text" },
    { key: "headline_2", label: "Headline baris 2", type: "text" },
    { key: "subheadline", label: "Subheadline", type: "textarea", rows: 2 },
    { key: "cta_primary", label: "CTA utama", type: "link" },
    { key: "cta_secondary", label: "CTA sekunder", type: "link" },
    { key: "image_media_id", label: "Gambar hero", type: "media", hint: "Foto ruang nyata, bukan render/product shot." },
    { key: "annotations", label: "Anotasi gambar", type: "repeater", max: 4, itemLabel: "Anotasi", fields: [{ key: "label", label: "Label", type: "text" }] },
  ],
  trust_strip: TRUST_LOGOS,
  tech_strip: TRUST_LOGOS, // heading harus framing "Technology We Work With" (01-PRD §7.4)
  solutions: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "subheadline", label: "Subheadline", type: "textarea", rows: 2 },
  ],
  how_we_work: STEPS,
  pillars: STEPS,
  catalog_teaser: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "subheadline", label: "Subheadline", type: "textarea", rows: 2 },
    { key: "cta", label: "CTA", type: "link" },
    {
      key: "category_products",
      label: "Produk per Kategori",
      type: "categoryProducts",
      hint: "Kosong = otomatis (produk unggulan, lalu produk terbaru di kategori itu). Pilih produk untuk mengunci foto yang tampil di carousel katalog homepage.",
    },
  ],
  proof: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "headline", label: "Headline", type: "text" },
    { key: "cta", label: "CTA (opsional)", type: "link" },
  ],
  why_acta: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "intro", label: "Intro", type: "textarea", rows: 2 },
    { key: "points", label: "Poin", type: "repeater", itemLabel: "Poin", fields: [
      { key: "title", label: "Judul", type: "text" },
      { key: "description", label: "Deskripsi", type: "textarea", rows: 2 },
    ] },
    { key: "cta", label: "CTA", type: "link" },
  ],
  stats: [
    { key: "stats", label: "Statistik", type: "repeater", itemLabel: "Statistik", hint: "Hanya angka terverifikasi owner. Kosong ⇒ section tidak dirender.", fields: [
      { key: "value", label: "Angka", type: "text" },
      { key: "suffix", label: "Suffix (opsional)", type: "text" },
      { key: "label", label: "Label", type: "text" },
    ] },
  ],
  final_cta: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "subheadline", label: "Subheadline", type: "textarea", rows: 2 },
    { key: "cta_primary", label: "CTA utama (label saja — nomor dari Settings)", type: "linkLabel" },
    { key: "cta_secondary", label: "CTA sekunder", type: "link" },
  ],
  story: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "headline", label: "Headline", type: "text" },
    { key: "body_md", label: "Body (Markdown)", type: "textarea", rows: 6 },
  ],
  team: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "members", label: "Anggota tim", type: "repeater", itemLabel: "Anggota", fields: [
      { key: "name", label: "Nama", type: "text" },
      { key: "role", label: "Peran", type: "text" },
      { key: "photo_media_id", label: "Foto", type: "media" },
      { key: "bio", label: "Bio", type: "textarea", rows: 2 },
    ] },
  ],
  intro: INTRO,
  newsletter: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "headline", label: "Headline", type: "text" },
    { key: "microcopy", label: "Microcopy", type: "textarea", rows: 2 },
  ],
};

// ── Pages → ordered sections (fixed; matches public renderer order) ───────────────────────
export type PageSectionRef = { key: string; label: string; description?: string };
export type PageDef = { key: string; label: string; sections: PageSectionRef[] };

export const PAGES: PageDef[] = [
  {
    key: "home",
    label: "Homepage",
    sections: [
      { key: "hero", label: "Hero" },
      { key: "trust_strip", label: "Trust strip" },
      { key: "solutions", label: "Solutions showcase" },
      { key: "how_we_work", label: "How we work" },
      { key: "catalog_teaser", label: "Catalog teaser" },
      { key: "proof", label: "Proof / Portfolio" },
      { key: "stats", label: "Stats", description: "Opsional — off default; angka kosong ⇒ tidak dirender." },
      { key: "why_acta", label: "Why ACTA" },
      { key: "final_cta", label: "Final CTA" },
    ],
  },
  {
    key: "about",
    label: "About",
    sections: [
      { key: "story", label: "Story" },
      { key: "pillars", label: "Pillars" },
      { key: "team", label: "Team" },
      { key: "tech_strip", label: "Tech strip", description: 'Heading: framing "Technology We Work With".' },
    ],
  },
  { key: "contact", label: "Contact", sections: [{ key: "intro", label: "Intro" }] },
  { key: "solutions_hub", label: "Solutions hub", sections: [{ key: "intro", label: "Intro" }] },
  { key: "catalog_hub", label: "Catalog hub", sections: [{ key: "intro", label: "Intro" }] },
  { key: "news_hub", label: "News hub", sections: [{ key: "intro", label: "Intro" }] },
  {
    key: "learn_hub",
    label: "Learn hub",
    sections: [
      { key: "intro", label: "Intro" },
      { key: "newsletter", label: "Newsletter" },
    ],
  },
];

export function getPageDef(pageKey: string): PageDef | undefined {
  return PAGES.find((p) => p.key === pageKey);
}

export function isValidSection(pageKey: string, sectionKey: string): boolean {
  return PAGES.some((p) => p.key === pageKey && p.sections.some((s) => s.key === sectionKey));
}

// Hub page_sections revalidate under their collection tag, not page:{key} (09 §4.2). Mirrors lib/queries/pages.ts.
const HUB_TAGS: Record<string, string> = { solutions_hub: "solutions", catalog_hub: "products", news_hub: "news", learn_hub: "learn" };
export function pageRevalidateTag(pageKey: string): string {
  return HUB_TAGS[pageKey] ?? `page:${pageKey}`;
}

// ── Zod schema derived from descriptors (validation SoT stays in sync with the UI) ───────
function fieldSchema(f: FieldDef): z.ZodTypeAny {
  switch (f.type) {
    case "text":
    case "textarea":
      return z.string().trim().default("");
    case "media":
      return z
        .union([z.string().uuid(), z.literal(""), z.null()])
        .transform((v) => (v ? v : null))
        .default(null);
    case "link":
      return z.object({ label: z.string().trim().default(""), href: z.string().trim().default("") }).default({ label: "", href: "" });
    case "linkLabel":
      return z.object({ label: z.string().trim().default("") }).default({ label: "" });
    case "repeater": {
      const item = z.object(Object.fromEntries((f.fields ?? []).map((sf) => [sf.key, fieldSchema(sf)])));
      const arr = f.max ? z.array(item).max(f.max) : z.array(item);
      return arr.default([]);
    }
    case "categoryProducts":
      // { [category_slug]: product_id | "" } — "" (or a missing key) means "auto" (06 §1.2 fallback).
      return z.record(z.string(), z.string()).default({});
  }
}

export function contentSchema(fields: FieldDef[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));
}

// ── Hydrate stored content into a fully-populated (defaults-filled) form value ───────────
export function hydrateContent(fields: FieldDef[], stored: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const src = stored ?? {};
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = src[f.key];
    if (f.type === "repeater") {
      const arr = Array.isArray(v) ? v : [];
      out[f.key] = arr.map((it) => hydrateContent(f.fields ?? [], (it ?? {}) as Record<string, unknown>));
    } else if (f.type === "link") {
      const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
      out[f.key] = { label: String(o.label ?? ""), href: String(o.href ?? "") };
    } else if (f.type === "linkLabel") {
      const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
      out[f.key] = { label: String(o.label ?? "") };
    } else if (f.type === "media") {
      out[f.key] = typeof v === "string" && v ? v : null;
    } else if (f.type === "categoryProducts") {
      out[f.key] = v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } else {
      out[f.key] = typeof v === "string" ? v : v == null ? "" : String(v);
    }
  }
  return out;
}

export function emptyItem(fields: FieldDef[]): Record<string, unknown> {
  return hydrateContent(fields, {});
}
