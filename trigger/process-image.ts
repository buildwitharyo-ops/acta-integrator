import { task } from "@trigger.dev/sdk/v3";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadImage } from "@/lib/catalog-pipeline/images/download";
import { removeBackground } from "@/lib/catalog-pipeline/images/background-removal";
import { finalizeProductImage } from "@/lib/catalog-pipeline/images/transform";

// Fase 3 (PRD §4.4, §10) — one job per proposed research image. Runs on Trigger.dev, same
// rationale as research-item.ts (Vercel Hobby's 10s limit can't fit download+remove.bg+sharp).
// A failure here is scoped to this ONE image (PRD §6 "partial" — the draft still reviews fine
// with whatever images succeeded), never fails the parent research draft.

type Payload = { jobId: string; draftId: string; imageIndex: number; url: string };

async function logEvent(sb: ReturnType<typeof createAdminClient>, jobId: string, step: string, message?: string) {
  await sb.from("ai_job_events").insert({ job_id: jobId, step, message: message ?? null });
}

async function patchImage(sb: ReturnType<typeof createAdminClient>, draftId: string, index: number, patch: Record<string, string>) {
  // Atomic jsonb_set — NOT a JS read-modify-write — because sibling images of the same draft can
  // be processed by concurrent task runs (queue concurrencyLimit below), which would otherwise
  // race on proposed_images and silently drop one image's result (migration
  // 20260717170000_update_proposed_image_rpc.sql).
  const { error } = await sb.rpc("update_proposed_image", { p_draft_id: draftId, p_index: index, p_patch: patch });
  if (error) throw new Error(`update_proposed_image gagal: ${error.message}`);
}

export const processImageTask = task({
  id: "process-image",
  queue: { concurrencyLimit: 3 }, // CPU-bound inference on the Oracle instance (shared with n8n) — stay conservative
  retry: { maxAttempts: 2, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 20_000, randomize: true },

  run: async (payload: Payload, { ctx }) => {
    const { jobId, draftId, imageIndex, url } = payload;
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
    await patchImage(sb, draftId, imageIndex, { job_id: jobId, status: "processing" });
    await logEvent(sb, jobId, "attempt_start", `Gambar #${imageIndex}, percobaan ke-${ctx.attempt.number}: ${url}`);

    await logEvent(sb, jobId, "downloading", url);
    const { buffer } = await downloadImage(url);

    await logEvent(sb, jobId, "removing_background", "Memanggil rembg self-hosted.");
    const cutout = await removeBackground(buffer);

    await logEvent(sb, jobId, "finalizing", "Trim/resize/webp.");
    const final = await finalizeProductImage(cutout);

    const hash = createHash("md5").update(url).digest("hex").slice(0, 8);
    const path = `processed/${draftId}-${imageIndex}-${hash}.webp`;
    const { error: upErr } = await sb.storage.from("catalog-raw").upload(path, final.buffer, { contentType: "image/webp", upsert: true });
    if (upErr) throw new Error(`Gagal upload ke catalog-raw: ${upErr.message}`);

    await patchImage(sb, draftId, imageIndex, { status: "ok", processed_path: path });
    await sb.from("ai_jobs").update({ status: "succeeded", finished_at: new Date().toISOString() }).eq("id", jobId);
    await logEvent(sb, jobId, "succeeded", `${path} (${final.width}x${final.height})`);

    return { processedPath: path };
  },

  onFailure: async ({ payload, error, ctx }) => {
    const sb = createAdminClient();
    const message = error instanceof Error ? error.message : String(error);
    await patchImage(sb, payload.draftId, payload.imageIndex, { status: "failed", fail_reason: message });
    await sb
      .from("ai_jobs")
      .update({ status: "failed", error: message, attempt: ctx.attempt.number, finished_at: new Date().toISOString() })
      .eq("id", payload.jobId);
    await logEvent(sb, payload.jobId, "failed", `Gambar #${payload.imageIndex} gagal (non-fatal untuk draft): ${message}`);
  },
});
