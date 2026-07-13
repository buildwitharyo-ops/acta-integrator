"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidateCatalog() {
  revalidateTag("products");
}

// ── Categories (admin only) ──────────────────────────────────────────────────────────────
const categorySchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  description: z.string().trim().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
});

export async function saveCategory(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  const supabase = await createClient();
  const slug = await uniqueSlug("product_categories", slugify(v.name), { excludeId: v.id ?? undefined });
  const row = { name: v.name, slug, description: v.description || null, sort_order: v.sort_order };

  if (v.id) {
    const { error: upErr } = await supabase.from("product_categories").update(row).eq("id", v.id).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan (nama sudah ada / akses ditolak?)." };
    revalidateCatalog();
    return { ok: true, id: v.id };
  }
  const { data, error: insErr } = await supabase.from("product_categories").insert(row).select("id").single();
  if (insErr || !data) return { ok: false, error: "Gagal membuat kategori (nama sudah ada?)." };
  revalidateCatalog();
  return { ok: true, id: data.id };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const admin = createAdminClient();
  const { count } = await admin.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count && count > 0) return { ok: false, error: `Tidak bisa dihapus: masih ada ${count} produk di kategori ini.` };

  const supabase = await createClient();
  const { error: delErr } = await supabase.from("product_categories").delete().eq("id", id);
  if (delErr) return { ok: false, error: "Gagal menghapus kategori." };
  revalidateCatalog();
  return { ok: true, id };
}

// ── Brands (admin manages fully here; dealer flag admin-gated by RLS) ─────────────────────
const brandSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  website: z.string().url().or(z.literal("")).optional().nullable(),
  is_authorized_dealer: z.boolean().default(false),
  logo_media_id: z.string().uuid().or(z.literal("")).optional().nullable(),
});

export async function saveBrand(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  const supabase = await createClient();
  const slug = await uniqueSlug("brands", slugify(v.name), { excludeId: v.id ?? undefined });
  const row = {
    name: v.name,
    slug,
    website: v.website || null,
    is_authorized_dealer: v.is_authorized_dealer,
    logo_media_id: v.logo_media_id || null,
  };

  if (v.id) {
    const { error: upErr } = await supabase.from("brands").update(row).eq("id", v.id).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan brand (nama sudah ada / akses ditolak?)." };
    revalidateCatalog();
    return { ok: true, id: v.id };
  }
  const { data, error: insErr } = await supabase.from("brands").insert(row).select("id").single();
  if (insErr || !data) return { ok: false, error: "Gagal membuat brand (nama sudah ada?)." };
  revalidateCatalog();
  return { ok: true, id: data.id };
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const admin = createAdminClient();
  const { count } = await admin.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id);
  if (count && count > 0) return { ok: false, error: `Tidak bisa dihapus: masih ada ${count} produk dengan brand ini.` };

  const supabase = await createClient();
  const { error: delErr } = await supabase.from("brands").delete().eq("id", id);
  if (delErr) return { ok: false, error: "Gagal menghapus brand." };
  revalidateCatalog();
  return { ok: true, id };
}

// ── Spec definitions (admin only) ────────────────────────────────────────────────────────
const KEY_RE = /^[a-z][a-z0-9_]*$/;

const specDefSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid("Kategori wajib"),
  key: z.string().trim().regex(KEY_RE, "Key harus snake_case (huruf kecil, angka, underscore)."),
  label: z.string().trim().min(1, "Label wajib"),
  spec_group: z.string().trim().min(1, "Spec group wajib"),
  data_type: z.enum(["number", "text", "boolean", "enum"]),
  unit: z.string().trim().optional().nullable(),
  enum_options: z.array(z.string().trim().min(1)).optional().default([]),
  sort_order: z.coerce.number().int().default(0),
  is_filterable: z.boolean().default(false),
  is_comparable: z.boolean().default(true),
  better_direction: z.enum(["higher", "lower"]).optional().nullable(),
});

export async function saveSpecDef(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const parsed = specDefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  // Cross-field rules mirroring DB checks (fail early with a friendly message).
  if (v.data_type === "enum" && v.enum_options.length === 0) return { ok: false, error: "data_type enum wajib punya minimal 1 opsi." };
  if (v.better_direction && v.data_type !== "number") return { ok: false, error: "better_direction hanya untuk data_type number." };

  const supabase = await createClient();
  const admin = createAdminClient();

  const row = {
    category_id: v.category_id,
    label: v.label,
    spec_group: v.spec_group,
    data_type: v.data_type,
    unit: v.unit || null,
    enum_options: v.data_type === "enum" ? v.enum_options : null,
    sort_order: v.sort_order,
    is_filterable: v.is_filterable,
    is_comparable: v.is_comparable,
    better_direction: v.data_type === "number" ? v.better_direction ?? null : null,
  };

  if (v.id) {
    // key + category_id immutable; data_type immutable once values exist (08 §3.4).
    const { data: existing } = await admin.from("spec_definitions").select("key, data_type, category_id").eq("id", v.id).maybeSingle();
    if (!existing) return { ok: false, error: "Definition tidak ditemukan." };
    if (existing.data_type !== v.data_type) {
      const { count } = await admin.from("product_spec_values").select("id", { count: "exact", head: true }).eq("spec_definition_id", v.id);
      if (count && count > 0) return { ok: false, error: "data_type tidak bisa diubah karena sudah ada nilai — archive lalu buat baru." };
    }
    // Never write key/category_id on update (immutable).
    const { error: upErr } = await supabase.from("spec_definitions").update(row).eq("id", v.id).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan definition (akses ditolak?)." };
    revalidateCatalog();
    return { ok: true, id: v.id };
  }

  const { data, error: insErr } = await supabase
    .from("spec_definitions")
    .insert({ ...row, key: v.key })
    .select("id")
    .single();
  if (insErr || !data) return { ok: false, error: "Gagal membuat definition (key sudah dipakai di kategori ini?)." };
  revalidateCatalog();
  return { ok: true, id: data.id };
}

export async function archiveSpecDef(id: string, archived: boolean): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const { error: upErr } = await supabase.from("spec_definitions").update({ is_archived: archived }).eq("id", id).select("id").single();
  if (upErr) return { ok: false, error: "Gagal mengubah status arsip." };
  revalidateCatalog();
  return { ok: true, id };
}

export async function deleteSpecDef(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const admin = createAdminClient();
  const { count } = await admin.from("product_spec_values").select("id", { count: "exact", head: true }).eq("spec_definition_id", id);
  if (count && count > 0) return { ok: false, error: "Sudah ada nilai historis — gunakan Archive, bukan hapus permanen." };

  const supabase = await createClient();
  const { error: delErr } = await supabase.from("spec_definitions").delete().eq("id", id);
  if (delErr) return { ok: false, error: "Gagal menghapus definition." };
  revalidateCatalog();
  return { ok: true, id };
}

export async function reorderSpecDefs(ids: string[]): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  await Promise.all(ids.map((id, i) => supabase.from("spec_definitions").update({ sort_order: i }).eq("id", id)));
  revalidateCatalog();
  return { ok: true };
}
