"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import { isReservedLearnSlug } from "@/lib/learn/reserved-slugs";
import { listPathSlugsForLesson } from "@/lib/queries/learn/paths";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const articleSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  type: z.enum(["news", "learn"]),
  title: z.string().trim().min(1, "Judul wajib diisi"),
  slug: z.string().trim().optional().default(""),
  excerpt: z.string().trim().min(1, "Excerpt wajib diisi").max(160, "Excerpt maksimal 160 karakter"),
  cover_media_id: z.string().uuid().or(z.literal("")).optional().nullable(),
  body: z.unknown(),
  category_id: z.string().uuid().or(z.literal("")).optional().nullable(),
  level: z.enum(["dasar", "menengah"]).or(z.literal("")).optional().nullable(),
  author_id: z.string().uuid("Author wajib dipilih"),
  tags: z.array(z.string().trim().min(1)).default([]),
  is_featured: z.boolean().default(false),
  seo_title: z.string().trim().optional().nullable(),
  seo_description: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "scheduled", "published"]),
  scheduled_at: z.string().trim().optional().nullable(),
  related_product_ids: z.array(z.string().uuid()).max(4).default([]),
  related_solution_ids: z.array(z.string().uuid()).default([]),
}).superRefine((v, ctx) => {
  // Lessons live flat at /learn/{slug}, so they share a namespace with every
  // /learn/* sub-route: a lesson slugged 'alat' shadows the whole calculator
  // segment and 404s in a way nobody can diagnose (02 §7.1 · §9.3 rule 1).
  // Mirrors the DB CHECK articles_learn_slug_not_reserved_ck — both layers are
  // required, and RESERVED_LEARN_SLUGS must stay in step with
  // public.learn_slug_is_reserved(). Checked on the BASE slug, before
  // uniqueSlug() can disguise 'alat' as the perfectly legal 'alat-2'.
  if (v.type !== "learn") return;
  const candidate = slugify(v.slug || v.title);
  if (isReservedLearnSlug(candidate)) {
    ctx.addIssue({
      code: "custom",
      path: ["slug"],
      message: `Slug '${candidate}' dipesan untuk struktur URL.`,
    });
  }
});

function isDocLike(x: unknown): x is { type: "doc"; content?: unknown[] } {
  return !!x && typeof x === "object" && (x as { type?: unknown }).type === "doc";
}

function countWords(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const n = node as { text?: unknown; content?: unknown };
  let c = 0;
  if (typeof n.text === "string") c += n.text.trim().split(/\s+/).filter(Boolean).length;
  if (Array.isArray(n.content)) for (const ch of n.content) c += countWords(ch);
  return c;
}

function revalidateArticle(type: string, slug: string, oldSlug?: string, pathSlugs: readonly string[] = []) {
  revalidateTag(type); // 'news' | 'learn'
  revalidateTag(`${type}:${slug}`);
  if (oldSlug && oldSlug !== slug) revalidateTag(`${type}:${oldSlug}`);
  revalidateTag("page:home"); // mixed feed on homepage
  // §7.4: every JALUR the lesson belongs to. v_learn_path_lessons joins
  // published-on-both-sides, so publishing, unpublishing, renaming or deleting a
  // lesson changes the syllabus rendered at /learn/jalur/{slug} even though no
  // learn_paths row was touched — nothing else fires that tag, and there is no
  // time-based revalidation anywhere in this codebase to cover for it.
  for (const pathSlug of pathSlugs) revalidateTag(`jalur:${pathSlug}`);
}

// Path membership is only meaningful for lessons; news articles never join one.
async function learnPathSlugs(type: string, articleId: string | null): Promise<string[]> {
  if (type !== "learn" || !articleId) return [];
  return listPathSlugsForLesson(articleId);
}

export async function saveArticle(input: unknown): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const v = parsed.data;

  const supabase = await createClient();
  const admin = createAdminClient();

  // type is immutable after create — always trust the stored value on update.
  let articleId = v.id ?? null;
  let oldSlug: string | undefined;
  let wasPublished = false;
  let existingPublishedAt: string | null = null;
  let effectiveType: "news" | "learn" = v.type;

  if (articleId) {
    const { data: existing } = await admin.from("articles").select("slug, status, published_at, type").eq("id", articleId).maybeSingle();
    if (!existing) return { ok: false, error: "Artikel tidak ditemukan." };
    effectiveType = existing.type;
    oldSlug = existing.slug;
    wasPublished = existing.status === "published";
    existingPublishedAt = existing.published_at;
  }

  const level = effectiveType === "learn" ? v.level || null : null;
  const bodyDoc = isDocLike(v.body) ? v.body : { type: "doc", content: [] };

  // Publish/schedule guardrails (08 §5.4 + DB checks): cover required, alt required, future schedule.
  if (v.status === "published" || v.status === "scheduled") {
    if (!v.cover_media_id) return { ok: false, error: "Publish/jadwal butuh cover image." };
    const { data: cover } = await admin.from("media").select("alt").eq("id", v.cover_media_id).maybeSingle();
    if (!cover?.alt) return { ok: false, error: "Cover butuh alt text sebelum publish." };
  }
  let scheduledAt: string | null = null;
  let publishedAt: string | null = null;
  if (v.status === "scheduled") {
    if (!v.scheduled_at) return { ok: false, error: "Jadwal butuh tanggal & waktu." };
    const when = new Date(v.scheduled_at);
    if (Number.isNaN(when.getTime())) return { ok: false, error: "Tanggal jadwal tidak valid." };
    if (when.getTime() <= Date.now()) return { ok: false, error: "Jadwal harus di masa depan." };
    scheduledAt = when.toISOString();
  }
  if (v.status === "published") {
    publishedAt = existingPublishedAt ?? new Date().toISOString();
  }

  const slug = await uniqueSlug("articles", v.slug || slugify(v.title), { excludeId: articleId ?? undefined, type: effectiveType });

  const row = {
    type: effectiveType,
    slug,
    title: v.title,
    excerpt: v.excerpt,
    cover_media_id: v.cover_media_id || null,
    body: bodyDoc as unknown as Json,
    category_id: v.category_id || null,
    level,
    reading_time: Math.max(1, Math.round(countWords(bodyDoc) / 200)),
    author_id: v.author_id,
    tags: v.tags,
    is_featured: v.is_featured,
    status: v.status,
    published_at: publishedAt,
    scheduled_at: scheduledAt,
    seo_title: v.seo_title || null,
    seo_description: v.seo_description || null,
    updated_by: ctx.userId,
  };

  if (articleId) {
    const { error: upErr } = await supabase.from("articles").update(row).eq("id", articleId).select("id").single();
    if (upErr) return { ok: false, error: "Gagal menyimpan (akses ditolak?)." };
  } else {
    const { data: inserted, error: insErr } = await supabase.from("articles").insert(row).select("id").single();
    if (insErr || !inserted) return { ok: false, error: "Gagal membuat artikel." };
    articleId = inserted.id;
  }

  // Related products (ordered, <=4) + related solutions (membership) — article-owned junctions.
  await supabase.from("article_products").delete().eq("article_id", articleId);
  if (v.related_product_ids.length) {
    await supabase.from("article_products").insert(
      v.related_product_ids.map((pid, i) => ({ article_id: articleId!, product_id: pid, sort_order: i })),
    );
  }
  await supabase.from("article_solutions").delete().eq("article_id", articleId);
  if (v.related_solution_ids.length) {
    await supabase.from("article_solutions").insert(
      v.related_solution_ids.map((sid) => ({ article_id: articleId!, solution_id: sid })),
    );
  }

  if (oldSlug && oldSlug !== slug && wasPublished) {
    await admin.from("redirects").insert({ source_path: `/${effectiveType}/${oldSlug}`, destination_path: `/${effectiveType}/${slug}` });
  }

  revalidateArticle(effectiveType, slug, oldSlug, await learnPathSlugs(effectiveType, articleId));
  return { ok: true, id: articleId };
}

export async function setArticleStatus(id: string, status: "draft" | "published"): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: existing } = await admin.from("articles").select("type, cover_media_id, published_at").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, error: "Artikel tidak ditemukan." };

  const patch: { status: "draft" | "published"; updated_by: string; published_at?: string } = { status, updated_by: ctx.userId };
  if (status === "published") {
    if (!existing.cover_media_id) return { ok: false, error: "Publish butuh cover image." };
    const { data: cover } = await admin.from("media").select("alt").eq("id", existing.cover_media_id).maybeSingle();
    if (!cover?.alt) return { ok: false, error: "Cover butuh alt text sebelum publish." };
    patch.published_at = existing.published_at ?? new Date().toISOString();
  }

  const { data, error: upErr } = await supabase.from("articles").update(patch).eq("id", id).select("slug").single();
  if (upErr || !data) return { ok: false, error: "Gagal mengubah status." };
  // Publish/unpublish is exactly the mutation that adds or removes a step from
  // every path listing this lesson, so the jalur fan-out matters most here.
  revalidateArticle(existing.type, data.slug, undefined, await learnPathSlugs(existing.type, id));
  return { ok: true, id };
}

export async function deleteArticle(id: string): Promise<SaveResult> {
  const { ctx, error } = await requireAdmin("editor"); // RLS: editor may delete drafts only; admin any.
  if (!ctx) return { ok: false, error };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("articles").select("type").eq("id", id).maybeSingle();
  // Read membership BEFORE the delete: learn_path_lessons cascades on
  // articles(id), so afterwards there is nothing left to tell us which paths
  // just lost a step.
  const pathSlugs = existing ? await learnPathSlugs(existing.type, id) : [];

  const supabase = await createClient();
  const { data: deleted, error: delErr } = await supabase.from("articles").delete().eq("id", id).select("id");
  if (delErr) return { ok: false, error: "Gagal menghapus artikel." };
  if (!deleted || deleted.length === 0) return { ok: false, error: "Tidak bisa menghapus (hanya draft, atau butuh admin)." };
  if (existing) revalidateArticle(existing.type, "", undefined, pathSlugs);
  return { ok: true, id };
}
