"use server";

import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { parseWorkbook, parsePrice, type ParsedRow } from "@/lib/catalog-pipeline/parser";
import { dedupeRows } from "@/lib/catalog-pipeline/dedupe";
import {
  getApprovableItemIds,
  getItemForReview,
  materializeDraftImages,
  getItemStatuses as getItemStatusesQuery,
} from "@/lib/catalog-pipeline/queries";
import { buildImageInputs, buildSpecValues } from "@/lib/catalog-pipeline/draft-to-product";
import type { DraftSpec, ProposedImage } from "@/lib/catalog-pipeline/types";
import { saveProduct } from "@/lib/actions/admin/products";
import type { researchItemTask } from "@/trigger/research-item";

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function uploadCatalog(formData: FormData): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Tidak ada file." };
  if (!/\.(xlsx|csv)$/i.test(file.name)) return { ok: false, error: "Hanya .xlsx atau .csv yang didukung." };

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: ParsedRow[];
  try {
    rows = await parseWorkbook(buffer, file.name);
  } catch (e) {
    return { ok: false, error: `Gagal parsing file: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (rows.length === 0) return { ok: false, error: "Tidak ada baris produk terbaca dari file ini." };

  const admin = createAdminClient();
  const path = `imports/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: upErr } = await admin.storage
    .from("catalog-raw")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) return { ok: false, error: "Gagal upload file ke storage." };

  const supabase = await createClient();
  const { data: imp, error: impErr } = await supabase
    .from("catalog_imports")
    .insert({ source_filename: file.name, storage_path: path, row_count: rows.length, status: "staged", uploaded_by: ctx.userId })
    .select("id")
    .single();
  if (impErr || !imp) return { ok: false, error: "Gagal membuat import." };

  const deduped = await dedupeRows(rows);
  const { error: itemsErr } = await supabase.from("catalog_import_items").insert(
    deduped.map((r) => ({
      import_id: imp.id,
      row_index: r.rowIndex,
      raw_data: r,
      brand_raw: r.brand,
      model_raw: r.model,
      category_guess: r.section,
      price_internal: parsePrice(r.harga),
      dedupe_status: r.dedupeStatus,
      matched_product_id: r.matchedProductId,
      status: "pending" as const,
    })),
  );
  if (itemsErr) return { ok: false, error: "File terupload tapi gagal menyimpan baris — hubungi dev." };

  return { ok: true, id: imp.id };
}

// Fase 2 (PRD §4.4): no longer calls the AI provider inline — enqueues an ai_jobs row and hands
// it to Trigger.dev (trigger/research-item.ts does the actual work, off Vercel's Hobby-plan 10s
// limit entirely). Returns as soon as the job is queued, not when research finishes.
export async function startResearch(itemId: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: item } = await admin.from("catalog_import_items").select("id").eq("id", itemId).maybeSingle();
  if (!item) return { ok: false, error: "Item tidak ditemukan." };

  // ai_jobs has no insert/update RLS policy for authenticated users (worker writes via
  // service-role only, PRD §4.2) — this action already authorized the caller via requireAdmin()
  // above, so it deliberately uses `admin` here rather than the session-scoped `supabase` client.
  const provider = process.env.AI_PROVIDER || "gemini";
  const { data: jobRow, error: jobErr } = await admin
    .from("ai_jobs")
    .insert({ type: "research_item", status: "queued", import_item_id: itemId, provider, created_by: ctx.userId })
    .select("id")
    .single();
  if (jobErr || !jobRow) return { ok: false, error: "Gagal membuat job." };

  await supabase.from("catalog_import_items").update({ status: "queued" }).eq("id", itemId);

  try {
    const handle = await tasks.trigger<typeof researchItemTask>("research-item", { jobId: jobRow.id, itemId });
    await admin.from("ai_jobs").update({ external_run_id: handle.id }).eq("id", jobRow.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("ai_jobs").update({ status: "failed", error: `Gagal memicu job: ${message}` }).eq("id", jobRow.id);
    await supabase.from("catalog_import_items").update({ status: "failed" }).eq("id", itemId);
    return { ok: false, error: `Gagal memulai riset: ${message}` };
  }

  return { ok: true, id: jobRow.id };
}

// Job History "Retry" (PRD §5.5) — re-queues a dead-lettered job. Trigger.dev's own retry budget
// (trigger/research-item.ts's retry.maxAttempts) is per-trigger, so a fresh trigger() call here
// gets its own full retry budget again rather than continuing a half-spent one.
export async function retryFailedJob(jobId: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: job } = await admin.from("ai_jobs").select("id, import_item_id, status").eq("id", jobId).maybeSingle();
  if (!job) return { ok: false, error: "Job tidak ditemukan." };
  if (job.status !== "failed") return { ok: false, error: "Hanya job berstatus gagal yang bisa di-retry." };
  if (!job.import_item_id) return { ok: false, error: "Job ini tidak terhubung ke item manapun." };

  // Same rationale as startResearch() above — ai_jobs writes go through service-role.
  await admin.from("ai_jobs").update({ status: "queued", error: null }).eq("id", jobId);
  await supabase.from("catalog_import_items").update({ status: "queued" }).eq("id", job.import_item_id);

  try {
    const handle = await tasks.trigger<typeof researchItemTask>("research-item", { jobId, itemId: job.import_item_id });
    await admin.from("ai_jobs").update({ external_run_id: handle.id }).eq("id", jobId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("ai_jobs").update({ status: "failed", error: `Gagal retry: ${message}` }).eq("id", jobId);
    return { ok: false, error: message };
  }

  return { ok: true, id: jobId };
}

// Called by the review page after ProductForm's own saveProduct() succeeds (PRD §5.4) — links
// the draft to the real product it produced. Never writes to products/product_spec_values itself.
export async function linkApprovedDraft(draftId: string, productId: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();

  const { data: draft } = await supabase.from("product_research_drafts").select("import_item_id").eq("id", draftId).maybeSingle();
  if (!draft) return { ok: false, error: "Draft tidak ditemukan." };

  await supabase
    .from("product_research_drafts")
    .update({ committed_product_id: productId, reviewed_by: ctx.userId, reviewed_at: new Date().toISOString() })
    .eq("id", draftId);
  await supabase.from("catalog_import_items").update({ status: "seeded" }).eq("id", draft.import_item_id);

  return { ok: true, id: productId };
}

// Lightweight polling target for the staging table (PRD §6 — polling, not a websocket). Thin
// "use server" wrapper so a client component can call it; the actual query lives in
// lib/catalog-pipeline/queries.ts so Server Component pages can reuse it directly too.
export async function getItemStatuses(importId: string) {
  const { ctx } = await requireAdmin("editor");
  if (!ctx) return [];
  return getItemStatusesQuery(importId);
}

// Fase 4 (PRD §10 item 1) — bulk-approve every ready item in this import whose latest draft is
// confidence="tinggi" AND status_recommendation="publish". Explicit admin click, never automatic
// (PRD §2 Non-Goals). Re-derives the qualifying set itself (never trusts a client-supplied list),
// and commits each one through saveProduct() — the SAME guardrail-enforcing function the manual
// review path uses — so there is still only one code path that can ever create a published
// product (PRD §4.6/§9).
export type BulkApproveResult = {
  ok: true;
  approved: number;
  skipped: { itemId: string; reason: string }[];
};

export async function bulkApproveReady(importId: string): Promise<BulkApproveResult | { ok: false; error: string }> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  const admin = createAdminClient();
  const itemIds = await getApprovableItemIds(importId);
  if (itemIds.length === 0) return { ok: true, approved: 0, skipped: [] };

  const [{ data: brands }, { data: specDefs }] = await Promise.all([
    admin.from("brands").select("id, name"),
    admin.from("spec_definitions").select("id, product_type_id, key, data_type").eq("is_archived", false),
  ]);

  let approved = 0;
  const skipped: { itemId: string; reason: string }[] = [];

  for (const itemId of itemIds) {
    const reviewData = await getItemForReview(itemId);
    if (!reviewData?.draft) {
      skipped.push({ itemId, reason: "Draft tidak ditemukan." });
      continue;
    }
    const { item, draft } = reviewData;

    const brandMatch = (brands ?? []).find((b) => b.name.toLowerCase() === item.brand_raw.toLowerCase());
    if (!brandMatch) {
      skipped.push({ itemId, reason: `Brand "${item.brand_raw}" belum ada di katalog.` });
      continue;
    }
    if (!draft.category_id || !draft.product_type_id) {
      skipped.push({ itemId, reason: "Kategori/product type belum terpetakan." });
      continue;
    }

    const proposedImages = await materializeDraftImages(draft.id, (draft.proposed_images as unknown as ProposedImage[]) ?? []);
    const images = buildImageInputs(proposedImages);
    const specValues = buildSpecValues((draft.specs as unknown as DraftSpec[]) ?? [], specDefs ?? [], draft.product_type_id);

    const result = await saveProduct({
      id: null,
      name: draft.name_correction || draft.name,
      slug: "",
      brand_id: brandMatch.id,
      category_id: draft.category_id,
      product_type_id: draft.product_type_id,
      short_spec: draft.short_spec ?? "",
      description_md: draft.description_md ?? "",
      suitable_for: draft.suitable_for ?? "",
      spec_source_url: draft.spec_source_url ?? "",
      internal_price: item.price_internal,
      is_featured: false,
      seo_title: "",
      seo_description: "",
      status: "published",
      related_solution_ids: [],
      similar_product_ids: [],
      images,
      spec_values: specValues,
    });

    if (!result.ok) {
      skipped.push({ itemId, reason: result.error });
      continue;
    }

    await linkApprovedDraft(draft.id, result.id);
    approved += 1;
  }

  return { ok: true, approved, skipped };
}

export async function rejectDraft(draftId: string, reason: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();

  const { data: draft } = await supabase.from("product_research_drafts").select("import_item_id").eq("id", draftId).maybeSingle();
  if (!draft) return { ok: false, error: "Draft tidak ditemukan." };

  await supabase
    .from("product_research_drafts")
    .update({ reviewed_by: ctx.userId, reviewed_at: new Date().toISOString(), review_notes: reason })
    .eq("id", draftId);
  await supabase.from("catalog_import_items").update({ status: "rejected" }).eq("id", draft.import_item_id);

  return { ok: true, id: draftId };
}

// Fase 4 (PRD §10 item 3) — admin-only (RLS also enforces admin_role='admin'), same pattern as
// lib/actions/admin/settings.ts's updateSettings().
const pipelineSettingsSchema = z.object({
  auto_publish_min_confidence: z.enum(["tinggi", "sedang", "rendah"]),
  auto_publish_require_recommendation: z.boolean(),
});

export async function saveCatalogPipelineSettings(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };

  const parsed = pipelineSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = await createClient();
  const { error: upErr } = await supabase
    .from("catalog_pipeline_settings")
    .update({ ...parsed.data, updated_by: ctx.userId })
    .eq("id", 1);
  if (upErr) return { ok: false, error: "Gagal menyimpan pengaturan (akses ditolak?)." };

  return { ok: true, id: "1" };
}
