import { task, tasks } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAiProvider } from "@/lib/ai/provider";
import { getResearchContext, resolveTaxonomy } from "@/lib/catalog-pipeline/queries";
import type { processImageTask } from "@/trigger/process-image";

// Fase 2 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §4.4, §6) — the async worker that Fase 1's
// synchronous startResearch() was inlined as. Runs on Trigger.dev's infrastructure, not a Vercel
// function, so it isn't bound by the project's Hobby-plan 10s request timeout. Retry/backoff and
// concurrency are Trigger.dev-native (PRD §7.9) rather than hand-rolled.

type Payload = { jobId: string; itemId: string };

async function logEvent(sb: ReturnType<typeof createAdminClient>, jobId: string, step: string, message?: string) {
  await sb.from("ai_job_events").insert({ job_id: jobId, step, message: message ?? null });
}

export const researchItemTask = task({
  id: "research-item",
  queue: { concurrencyLimit: 5 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 30_000, randomize: true },

  run: async (payload: Payload, { ctx }) => {
    const { jobId, itemId } = payload;
    const sb = createAdminClient();

    await sb
      .from("ai_jobs")
      .update({
        status: "running",
        attempt: ctx.attempt.number,
        external_run_id: ctx.run.id,
        started_at: ctx.attempt.number === 1 ? new Date().toISOString() : undefined,
      })
      .eq("id", jobId);
    await sb.from("catalog_import_items").update({ status: "researching" }).eq("id", itemId);
    await logEvent(sb, jobId, "attempt_start", `Percobaan ke-${ctx.attempt.number}`);

    const { data: item } = await sb
      .from("catalog_import_items")
      .select("id, brand_raw, model_raw, raw_data, price_internal")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) throw new Error(`Item ${itemId} tidak ditemukan.`);

    const rawData = item.raw_data as { fungsi?: string } | null;
    await logEvent(sb, jobId, "fetching_context", "Mengambil vocabulary kategori/spec existing.");
    const context = await getResearchContext();

    await logEvent(sb, jobId, "calling_ai", "Memanggil AI provider.");
    const ai = getAiProvider();
    const result = await ai.research({
      brand: item.brand_raw,
      model: item.model_raw,
      fungsi: rawData?.fungsi ?? "",
      hargaHint: item.price_internal ? `Rp ${Number(item.price_internal).toLocaleString("id-ID")}` : null,
      ...context,
    });
    await logEvent(sb, jobId, "ai_responded", `confidence=${result.confidence} status_recommendation=${result.status_recommendation}`);

    const { categoryId, productTypeId } = await resolveTaxonomy(result.category_guess, result.product_type_name);

    const { data: draft, error: draftErr } = await sb
      .from("product_research_drafts")
      .insert({
        import_item_id: itemId,
        name: result.name,
        name_correction: result.name_correction || null,
        category_id: categoryId,
        product_type_id: productTypeId,
        new_product_type_name: productTypeId ? null : result.product_type_name,
        short_spec: result.short_spec || null,
        description_md: result.description_md || null,
        suitable_for: result.suitable_for || null,
        spec_source_url: result.spec_source_url || null,
        confidence: result.confidence,
        confidence_notes: result.confidence_notes || null,
        status_recommendation: result.status_recommendation,
        skip_reason: result.skip_reason || null,
        specs: result.specs,
        proposed_images: result.images,
      })
      .select("id")
      .single();
    if (draftErr || !draft) throw new Error(draftErr?.message ?? "Gagal menyimpan draft.");

    // Fase 3 (PRD §4.4/§10): fan out one process_image job per proposed image. Failures here are
    // per-image and non-fatal to this draft (PRD §6) — never awaited/blocking the draft's own
    // ready_for_review transition below.
    if (result.status_recommendation !== "skip") {
      for (let i = 0; i < result.images.length; i++) {
        const image = result.images[i]!;
        const { data: imgJob } = await sb
          .from("ai_jobs")
          .insert({
            type: "process_image",
            status: "queued",
            import_item_id: itemId,
            provider: "remove.bg",
            input: { draftId: draft.id, imageIndex: i, url: image.url },
          })
          .select("id")
          .single();
        if (!imgJob) continue;
        try {
          const handle = await tasks.trigger<typeof processImageTask>("process-image", {
            jobId: imgJob.id,
            draftId: draft.id,
            imageIndex: i,
            url: image.url,
          });
          await sb.from("ai_jobs").update({ external_run_id: handle.id }).eq("id", imgJob.id);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          await sb.from("ai_jobs").update({ status: "failed", error: `Gagal memicu job: ${message}` }).eq("id", imgJob.id);
        }
      }
    }

    const nextStatus = result.status_recommendation === "skip" ? "rejected" : "ready_for_review";
    await sb.from("catalog_import_items").update({ status: nextStatus }).eq("id", itemId);
    await sb
      .from("ai_jobs")
      .update({ status: "succeeded", output: result, finished_at: new Date().toISOString() })
      .eq("id", jobId);
    await logEvent(sb, jobId, "succeeded", `Draft ${draft.id} dibuat, item -> ${nextStatus}.`);

    return { draftId: draft.id };
  },

  // Called once, after Trigger.dev's own retry budget (retry.maxAttempts above) is exhausted —
  // this is the dead-letter transition (PRD §6), not a per-attempt failure handler.
  onFailure: async ({ payload, error, ctx }) => {
    const sb = createAdminClient();
    const message = error instanceof Error ? error.message : String(error);
    await sb
      .from("ai_jobs")
      .update({ status: "failed", error: message, attempt: ctx.attempt.number, finished_at: new Date().toISOString() })
      .eq("id", payload.jobId);
    await sb.from("catalog_import_items").update({ status: "failed" }).eq("id", payload.itemId);
    await logEvent(sb, payload.jobId, "failed", `Semua percobaan (${ctx.attempt.number}) gagal: ${message}`);
  },
});
