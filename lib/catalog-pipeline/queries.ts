import "server-only";
import { createHash } from "node:crypto";
import { fetchAllRows } from "@/lib/admin/paginate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProposedImage } from "@/lib/catalog-pipeline/types";

// Reads for the catalog-import admin pages. Mirrors lib/admin/queries.ts convention: plain async
// functions using the service-role client, called from Server Components (page already verified
// admin via requireAdminPage in the panel layout).

// Fase 4 (PRD §10 item 2): per-import progress from the v_import_progress SQL view (one
// aggregate query) instead of fetching every item row and counting in JS.
export async function getImports() {
  const sb = createAdminClient();
  const { data: imports } = await sb
    .from("catalog_imports")
    .select("id, source_filename, row_count, status, notes, created_at")
    .order("created_at", { ascending: false });
  if (!imports?.length) return [];

  const { data: progress } = await sb
    .from("v_import_progress")
    .select("import_id, total_items, pending_count, queued_count, researching_count, ready_for_review_count, approved_count, rejected_count, seeded_count, failed_count")
    .in("import_id", imports.map((i) => i.id));
  const progressById = new Map((progress ?? []).map((p) => [p.import_id, p]));

  return imports.map((imp) => ({ ...imp, progress: progressById.get(imp.id) ?? null }));
}

export async function getImportWithItems(importId: string) {
  const sb = createAdminClient();
  const [{ data: imp }, { data: items }] = await Promise.all([
    sb.from("catalog_imports").select("id, source_filename, row_count, status, notes, created_at").eq("id", importId).maybeSingle(),
    sb
      .from("catalog_import_items")
      .select("id, row_index, brand_raw, model_raw, category_guess, price_internal, dedupe_status, matched_product_id, status")
      .eq("import_id", importId)
      .order("row_index"),
  ]);
  if (!imp) return null;
  return { import: imp, items: items ?? [] };
}

// Fase 4 (PRD §10 item 1): items in THIS import whose latest draft qualifies for bulk-approve
// (meeting the admin-configurable threshold below) and hasn't been acted on yet. Recomputed
// server-side by both the count shown in the UI and bulkApproveReady() itself — never trust a
// client-supplied id list for something that writes real products.
const CONFIDENCE_RANK: Record<string, number> = { tinggi: 3, sedang: 2, rendah: 1 };

// Fase 4 (PRD §10 item 3) — was hardcoded confidence="tinggi" AND status_recommendation="publish";
// now reads catalog_pipeline_settings so an admin can loosen/tighten it without a code change.
export async function getCatalogPipelineSettings() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("catalog_pipeline_settings")
    .select("auto_publish_min_confidence, auto_publish_require_recommendation")
    .eq("id", 1)
    .single();
  return data ?? { auto_publish_min_confidence: "tinggi" as const, auto_publish_require_recommendation: true };
}

export async function getApprovableItemIds(importId: string): Promise<string[]> {
  const sb = createAdminClient();
  const [{ data: items }, settings] = await Promise.all([
    sb.from("catalog_import_items").select("id").eq("import_id", importId).eq("status", "ready_for_review"),
    getCatalogPipelineSettings(),
  ]);
  if (!items?.length) return [];

  const itemIds = items.map((i) => i.id);
  const drafts = await fetchAllRows<{ import_item_id: string; confidence: string; status_recommendation: string; created_at: string }>(
    (from, to) =>
      sb
        .from("product_research_drafts")
        .select("import_item_id, confidence, status_recommendation, created_at")
        .in("import_item_id", itemIds)
        .order("created_at", { ascending: false })
        .range(from, to),
  );

  const latestByItem = new Map<string, (typeof drafts)[number]>();
  for (const d of drafts) {
    if (!latestByItem.has(d.import_item_id)) latestByItem.set(d.import_item_id, d); // first hit = newest (sorted desc)
  }

  const minRank = CONFIDENCE_RANK[settings.auto_publish_min_confidence] ?? CONFIDENCE_RANK.tinggi!;
  return itemIds.filter((id) => {
    const d = latestByItem.get(id);
    if (!d) return false;
    const meetsConfidence = (CONFIDENCE_RANK[d.confidence] ?? 0) >= minRank;
    const meetsRecommendation = !settings.auto_publish_require_recommendation || d.status_recommendation === "publish";
    return meetsConfidence && meetsRecommendation;
  });
}

export async function getItemForReview(itemId: string) {
  const sb = createAdminClient();
  const { data: item } = await sb
    .from("catalog_import_items")
    .select("id, import_id, row_index, raw_data, brand_raw, model_raw, category_guess, price_internal, dedupe_status, status")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return null;

  const { data: draft } = await sb
    .from("product_research_drafts")
    .select("*")
    .eq("import_item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { item, draft };
}

// Job History (PRD §5.5) — flat log across every import, newest first, with enough item context
// (brand/model) to be useful without a second click.
export async function getJobs() {
  const sb = createAdminClient();
  const jobs = await fetchAllRows<{
    id: string;
    type: string;
    status: string;
    provider: string;
    import_item_id: string | null;
    error: string | null;
    attempt: number;
    max_attempts: number;
    external_run_id: string | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
  }>((from, to) =>
    sb
      .from("ai_jobs")
      .select("id, type, status, provider, import_item_id, error, attempt, max_attempts, external_run_id, started_at, finished_at, created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  if (jobs.length === 0) return [];

  const itemIds = [...new Set(jobs.map((j) => j.import_item_id).filter((x): x is string => Boolean(x)))];
  const { data: items } = await sb.from("catalog_import_items").select("id, brand_raw, model_raw").in("id", itemIds);
  const itemById = new Map((items ?? []).map((i) => [i.id, i]));

  return jobs.map((j) => ({ ...j, item: j.import_item_id ? (itemById.get(j.import_item_id) ?? null) : null }));
}

// Lightweight polling target for the staging table (PRD §6 — "polling ringan, BUKAN websocket").
export async function getItemStatuses(importId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("catalog_import_items").select("id, status").eq("import_id", importId);
  return data ?? [];
}

// Context handed to the AI prompt so it reuses existing taxonomy/spec vocabulary instead of
// inventing near-duplicates (PRD §4.5 / the exact problem seen in manual seeding this session).
export async function getResearchContext() {
  const sb = createAdminClient();
  const [{ data: categories }, { data: types }, defs] = await Promise.all([
    sb.from("product_categories").select("name").order("name"),
    sb.from("product_types").select("id, name").order("name"),
    fetchAllRows<{ key: string; product_type_id: string | null }>((from, to) =>
      sb.from("spec_definitions").select("key, product_type_id").eq("is_archived", false).range(from, to),
    ),
  ]);

  const specsByType = new Map<string, Set<string>>();
  for (const d of defs ?? []) {
    if (!d.product_type_id) continue;
    if (!specsByType.has(d.product_type_id)) specsByType.set(d.product_type_id, new Set());
    specsByType.get(d.product_type_id)!.add(d.key);
  }

  const vocabLines = (types ?? [])
    .map((t) => {
      const keys = [...(specsByType.get(t.id) ?? [])];
      return keys.length ? `${t.name}: ${keys.join(", ")}` : null;
    })
    .filter((line): line is string => Boolean(line));

  return {
    existingCategoryNames: (categories ?? []).map((c) => c.name),
    existingProductTypeNames: (types ?? []).map((t) => t.name),
    existingSpecKeysHint: vocabLines.join("\n"),
  };
}

// Fase 3 (PRD §4.4/§10, build-prompt #5/#6): copies each successfully-processed image from the
// private catalog-raw bucket into a real, public `media` row — but ONLY for the draft an admin is
// actively viewing right now (never proactively for drafts nobody has opened), and idempotently
// (skips images already committed on a repeat page load). This is what lets the Review Queue show
// the finished, background-removed image and let ProductForm's Gallery tab use it directly.
export async function materializeDraftImages(draftId: string, proposedImages: ProposedImage[]): Promise<ProposedImage[]> {
  const sb = createAdminClient();
  const result = [...proposedImages];
  let changed = false;

  for (let i = 0; i < result.length; i++) {
    const img = result[i]!;
    if (img.status !== "ok" || !img.processed_path || img.committed_media_id) continue;

    const { data: fileData, error: dlErr } = await sb.storage.from("catalog-raw").download(img.processed_path);
    if (dlErr || !fileData) continue; // leave uncommitted — reviewer just won't see this one yet

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const hash = createHash("md5").update(img.processed_path).digest("hex").slice(0, 8);
    const publicPath = `uploads/draft-${draftId}-${i}-${hash}.webp`;

    const { error: upErr } = await sb.storage.from("media").upload(publicPath, buffer, { contentType: "image/webp", upsert: true });
    if (upErr) continue;

    const { data: mediaRow, error: mediaErr } = await sb
      .from("media")
      .insert({ kind: "upload", storage_path: publicPath, is_placeholder: false, alt: img.angle_note ?? null })
      .select("id")
      .single();
    if (mediaErr || !mediaRow) continue;

    await sb.rpc("update_proposed_image", { p_draft_id: draftId, p_index: i, p_patch: { committed_media_id: mediaRow.id } });
    result[i] = { ...img, committed_media_id: mediaRow.id };
    changed = true;
  }

  return changed ? result : proposedImages;
}

// Deterministic (not AI) resolution of the AI's free-text category/type guess against existing
// rows — exact case-insensitive match only. No match => caller leaves category_id/product_type_id
// null and surfaces new_product_type_name for a human to resolve (PRD §5.4 / build-prompt #7).
export async function resolveTaxonomy(categoryGuess: string, productTypeName: string) {
  const sb = createAdminClient();
  const { data: category } = await sb
    .from("product_categories")
    .select("id, name")
    .ilike("name", categoryGuess.trim())
    .maybeSingle();

  if (!category) return { categoryId: null, productTypeId: null };

  const { data: type } = await sb
    .from("product_types")
    .select("id, name")
    .eq("category_id", category.id)
    .ilike("name", productTypeName.trim())
    .maybeSingle();

  return { categoryId: category.id, productTypeId: type?.id ?? null };
}
