"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const pillarSchema = z.object({ title: z.string().trim().min(1), description: z.string().trim().default("") });
const painSchema = z.object({ title: z.string().trim().min(1), body: z.string().trim().default("") });

const solutionSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  slug: z.string().trim().optional().default(""),
  tier: z.enum(["core", "supporting"]),
  value_prop: z.string().trim().min(1, "Value prop (one-liner) wajib diisi"),
  hero_headline: z.string().trim().optional().nullable(),
  hero_subcopy: z.string().trim().optional().nullable(),
  hero_media_id: z.string().uuid().optional().nullable(),
  wa_message: z.string().trim().optional().nullable(),
  seo_title: z.string().trim().optional().nullable(),
  seo_description: z.string().trim().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(["draft", "published"]),
  related_product_ids: z.array(z.string().uuid()).default([]),
  pain_points: z.array(painSchema).default([]),
  scope_pillars: z.array(pillarSchema).default([]),
});

function revalidateSolution(slug: string, oldSlug?: string) {
  revalidateTag("solutions");
  revalidateTag(`solution:${slug}`);
  if (oldSlug && oldSlug !== slug) revalidateTag(`solution:${oldSlug}`);
  revalidateTag("page:home");
}

export async function saveSolution(input: unknown): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const parsed = solutionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  // Publish guardrail (08 §5.4): name, value_prop, hero_image, >= 3 scope pillars.
  if (v.status === "published") {
    if (!v.hero_media_id) return { ok: false, error: "Publish butuh hero image." };
    if (v.scope_pillars.length < 3) return { ok: false, error: "Publish butuh minimal 3 blok approach (Scope of Work)." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const slug = await uniqueSlug("solutions", v.slug || slugify(v.name), { excludeId: v.id ?? undefined });

  const row = {
    name: v.name,
    slug,
    tier: v.tier,
    value_prop: v.value_prop,
    hero_headline: v.hero_headline || null,
    hero_subcopy: v.hero_subcopy || null,
    hero_media_id: v.hero_media_id || null,
    wa_message: v.wa_message || null,
    seo_title: v.seo_title || null,
    seo_description: v.seo_description || null,
    sort_order: v.sort_order,
    status: v.status,
    updated_by: ctx.userId,
  };

  let solutionId = v.id ?? null;
  let oldSlug: string | undefined;
  let wasPublished = false;

  if (solutionId) {
    const { data: existing } = await admin.from("solutions").select("slug, status").eq("id", solutionId).maybeSingle();
    oldSlug = existing?.slug ?? undefined;
    wasPublished = existing?.status === "published";
    const { error: upErr } = await supabase.from("solutions").update(row).eq("id", solutionId).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan (akses ditolak?)." };
  } else {
    const { data: inserted, error: insErr } = await supabase.from("solutions").insert(row).select("id").single();
    if (insErr || !inserted) return { ok: false, error: "Gagal membuat solution." };
    solutionId = inserted.id;
  }

  // Related products (product_solutions), ordered.
  await supabase.from("product_solutions").delete().eq("solution_id", solutionId);
  if (v.related_product_ids.length) {
    await supabase.from("product_solutions").insert(
      v.related_product_ids.map((pid, i) => ({ product_id: pid, solution_id: solutionId!, sort_order: i })),
    );
  }

  // Sections: replace pain_points + scope_pillar (leave system_copy/cta untouched).
  await supabase.from("solution_sections").delete().eq("solution_id", solutionId).in("type", ["pain_points", "scope_pillar"]);
  const sections = [];
  if (v.pain_points.length) {
    sections.push({ solution_id: solutionId, type: "pain_points" as const, heading: "Tantangan yang kami selesaikan", body: null, items: v.pain_points as unknown as Json, sort_order: 0 });
  }
  if (v.scope_pillars.length) {
    sections.push({ solution_id: solutionId, type: "scope_pillar" as const, heading: "Scope of Work", body: null, items: v.scope_pillars as unknown as Json, sort_order: 2 });
  }
  if (sections.length) await supabase.from("solution_sections").insert(sections);

  // Slug change on a previously-published solution → 301 redirect (08 §5.2).
  if (oldSlug && oldSlug !== slug && wasPublished) {
    await admin.from("redirects").insert({ source_path: `/solutions/${oldSlug}`, destination_path: `/solutions/${slug}` });
  }

  revalidateSolution(slug, oldSlug);
  return { ok: true, id: solutionId };
}

export async function setSolutionStatus(id: string, status: "draft" | "published"): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const admin = createAdminClient();

  if (status === "published") {
    const { data: s } = await admin.from("solutions").select("hero_media_id").eq("id", id).maybeSingle();
    // Pillars live inside the single scope_pillar section's items[] — count the pillars, not the row (08 §5.4).
    const { data: scope } = await admin
      .from("solution_sections")
      .select("items")
      .eq("solution_id", id)
      .eq("type", "scope_pillar")
      .maybeSingle();
    const pillarCount = Array.isArray(scope?.items) ? scope.items.length : 0;
    if (!s?.hero_media_id) return { ok: false, error: "Publish butuh hero image." };
    if (pillarCount < 3) return { ok: false, error: "Publish butuh minimal 3 blok approach (Scope of Work)." };
  }

  const { data, error: upErr } = await supabase.from("solutions").update({ status, updated_by: ctx.userId }).eq("id", id).select("slug").single();
  if (upErr || !data) return { ok: false, error: "Gagal mengubah status." };
  revalidateSolution(data.slug);
  return { ok: true, id };
}

export async function deleteSolution(id: string): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("admin"); // hard delete = admin only (08 §1.2)
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const { error: delErr } = await supabase.from("solutions").delete().eq("id", id);
  if (delErr) return { ok: false, error: "Gagal menghapus (hanya draft/admin)." };
  revalidateTag("solutions");
  revalidateTag("page:home");
  return { ok: true, id };
}
