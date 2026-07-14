"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const imageSchema = z.object({
  media_id: z.string().uuid(),
  image_annotation: z.string().trim().optional().nullable(),
});

const specValueSchema = z.object({
  spec_definition_id: z.string().uuid(),
  value_text: z.string().trim().min(1),
  value_number: z.number().nullable().optional(),
  value_boolean: z.boolean().nullable().optional(),
  value_options: z.array(z.string()).nullable().optional(),
});

const productSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  slug: z.string().trim().optional().default(""),
  brand_id: z.string().uuid("Brand wajib dipilih"),
  category_id: z.string().uuid("Kategori wajib dipilih"),
  short_spec: z.string().trim().max(80).optional().nullable(),
  description_md: z.string().trim().optional().nullable(),
  suitable_for: z.string().trim().optional().nullable(),
  spec_source_url: z.string().url().or(z.literal("")).optional().nullable(),
  internal_price: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nullable()),
  is_featured: z.boolean().default(false),
  seo_title: z.string().trim().optional().nullable(),
  seo_description: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "published"]),
  related_solution_ids: z.array(z.string().uuid()).default([]),
  similar_product_ids: z.array(z.string().uuid()).max(4).default([]),
  images: z.array(imageSchema).default([]),
  spec_values: z.array(specValueSchema).default([]),
});

function revalidateProduct(slug: string, oldSlug?: string) {
  revalidateTag("products");
  revalidateTag(`product:${slug}`);
  if (oldSlug && oldSlug !== slug) revalidateTag(`product:${oldSlug}`);
}

export async function saveProduct(input: unknown): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  // Publish guardrail (06 §4 / 08 §5.4): kategori, short_spec, >=1 foto, >=3 spec values.
  if (v.status === "published") {
    if (!v.short_spec) return { ok: false, error: "Publish butuh short spec." };
    if (v.images.length < 1) return { ok: false, error: "Publish butuh minimal 1 foto." };
    if (v.spec_values.length < 3) return { ok: false, error: "Publish butuh minimal 3 spec values." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const slug = await uniqueSlug("products", v.slug || slugify(v.name), { excludeId: v.id ?? undefined });

  const row = {
    name: v.name,
    slug,
    brand_id: v.brand_id,
    category_id: v.category_id,
    short_spec: v.short_spec ?? "",
    description_md: v.description_md || null,
    suitable_for: v.suitable_for || null,
    spec_source_url: v.spec_source_url || null,
    internal_price: v.internal_price,
    is_featured: v.is_featured,
    seo_title: v.seo_title || null,
    seo_description: v.seo_description || null,
    status: v.status,
    updated_by: ctx.userId,
  };

  let productId = v.id ?? null;
  let oldSlug: string | undefined;
  let wasPublished = false;

  if (productId) {
    const { data: existing } = await admin.from("products").select("slug, status").eq("id", productId).maybeSingle();
    oldSlug = existing?.slug ?? undefined;
    wasPublished = existing?.status === "published";
    const { error: upErr } = await supabase.from("products").update(row).eq("id", productId).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan (akses ditolak?)." };
  } else {
    const { data: inserted, error: insErr } = await supabase.from("products").insert(row).select("id").single();
    if (insErr || !inserted) return { ok: false, error: "Gagal membuat produk." };
    productId = inserted.id;
  }

  // Gallery
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (v.images.length) {
    await supabase.from("product_images").insert(
      v.images.map((img, i) => ({ product_id: productId!, media_id: img.media_id, sort_order: i, image_annotation: img.image_annotation || null })),
    );
  }

  // Spec values
  await supabase.from("product_spec_values").delete().eq("product_id", productId);
  if (v.spec_values.length) {
    await supabase.from("product_spec_values").insert(
      v.spec_values.map((sv) => ({
        product_id: productId!,
        spec_definition_id: sv.spec_definition_id,
        value_text: sv.value_text,
        value_number: sv.value_number ?? null,
        value_boolean: sv.value_boolean ?? null,
        value_options: sv.value_options ?? null,
      })),
    );
  }

  // Related solutions: sort_order in product_solutions is owned by the solution editor
  // (public solution pages order their products by it), so sync membership only — never
  // full delete+reinsert, which would reset that ordering and tie rows at the same index.
  const { data: existingSol } = await admin.from("product_solutions").select("solution_id").eq("product_id", productId);
  const existingSolIds = new Set((existingSol ?? []).map((r) => r.solution_id).filter((x): x is string => Boolean(x)));
  const desiredSolIds = new Set(v.related_solution_ids);
  const solToRemove = [...existingSolIds].filter((sid) => !desiredSolIds.has(sid));
  if (solToRemove.length) {
    await supabase.from("product_solutions").delete().eq("product_id", productId).in("solution_id", solToRemove);
  }
  const solToAdd = v.related_solution_ids.filter((sid) => !existingSolIds.has(sid));
  if (solToAdd.length) {
    const newLinks = [];
    for (const sid of solToAdd) {
      // Append at the end of that solution's product list so the solution's own order is preserved.
      const { count } = await admin.from("product_solutions").select("product_id", { count: "exact", head: true }).eq("solution_id", sid);
      newLinks.push({ product_id: productId!, solution_id: sid, sort_order: count ?? 0 });
    }
    await supabase.from("product_solutions").insert(newLinks);
  }

  await supabase.from("product_similar").delete().eq("product_id", productId);
  if (v.similar_product_ids.length) {
    await supabase.from("product_similar").insert(
      v.similar_product_ids.map((pid, i) => ({ product_id: productId!, similar_product_id: pid, sort_order: i })),
    );
  }

  if (oldSlug && oldSlug !== slug && wasPublished) {
    await admin.from("redirects").insert({ source_path: `/products/${oldSlug}`, destination_path: `/products/${slug}` });
  }

  revalidateProduct(slug, oldSlug);
  return { ok: true, id: productId };
}

export async function setProductStatus(id: string, status: "draft" | "published"): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const admin = createAdminClient();

  if (status === "published") {
    const [{ data: p }, { count: imgCount }, { count: specCount }] = await Promise.all([
      admin.from("products").select("short_spec, category_id").eq("id", id).maybeSingle(),
      admin.from("product_images").select("product_id", { count: "exact", head: true }).eq("product_id", id),
      admin.from("product_spec_values").select("product_id", { count: "exact", head: true }).eq("product_id", id),
    ]);
    if (!p?.short_spec || !p?.category_id) return { ok: false, error: "Publish butuh kategori + short spec." };
    if (!imgCount) return { ok: false, error: "Publish butuh minimal 1 foto." };
    if ((specCount ?? 0) < 3) return { ok: false, error: "Publish butuh minimal 3 spec values." };
  }

  const { data, error: upErr } = await supabase.from("products").update({ status, updated_by: ctx.userId }).eq("id", id).select("slug").single();
  if (upErr || !data) return { ok: false, error: "Gagal mengubah status." };
  revalidateProduct(data.slug);
  return { ok: true, id };
}

// Hard delete. RLS (adm_delete) lets editors remove DRAFTS only; admins remove anything. All child
// rows (images/specs/relations) cascade; site_settings.featured_product_id is set null automatically.
export async function deleteProduct(id: string): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("products").select("slug").eq("id", id).maybeSingle();

  const supabase = await createClient();
  const { data: deleted, error: delErr } = await supabase.from("products").delete().eq("id", id).select("id");
  if (delErr) return { ok: false, error: "Gagal menghapus produk." };
  if (!deleted || deleted.length === 0) return { ok: false, error: "Tidak bisa menghapus (produk published hanya bisa dihapus admin)." };

  revalidateTag("products");
  if (existing?.slug) revalidateTag(`product:${existing.slug}`);
  revalidateTag("page:home"); // homepage catalog teaser / featured
  revalidateTag("settings"); // featured_product_id may have been set null
  return { ok: true, id };
}

// Inline "tambah brand" (editors may add brands; only admins may set is_authorized_dealer=true — RLS enforces).
export async function createBrand(name: string): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Nama brand kosong." };
  const supabase = await createClient();
  const { data, error: insErr } = await supabase
    .from("brands")
    .insert({ name: clean, slug: slugify(clean), is_authorized_dealer: false })
    .select("id, name")
    .single();
  if (insErr || !data) return { ok: false, error: "Gagal menambah brand (mungkin sudah ada)." };
  revalidateTag("products");
  return { ok: true, id: data.id, name: data.name };
}
