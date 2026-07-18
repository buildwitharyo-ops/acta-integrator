-- Fase 3 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §4.4/§10): multiple process_image jobs for the same
-- draft can run concurrently (queue concurrencyLimit up to 5) and each needs to patch its own
-- element of product_research_drafts.proposed_images (a jsonb array). A JS read-modify-write from
-- two concurrent task runs would race and silently lose one image's result. jsonb_set inside a
-- single UPDATE is atomic per-row (Postgres serializes concurrent writers via the row lock), so do
-- the patch here instead of in application code.
create or replace function public.update_proposed_image(p_draft_id uuid, p_index int, p_patch jsonb)
returns void
language sql
as $$
  update product_research_drafts
  set proposed_images = jsonb_set(
    proposed_images,
    array[p_index::text],
    coalesce(proposed_images -> p_index, '{}'::jsonb) || p_patch,
    true
  )
  where id = p_draft_id;
$$;

-- Service-role only (called from trigger/process-image.ts via the admin client) — no anon/
-- authenticated grant, matching the ai_jobs "worker writes via service-role" pattern (§4.2).
revoke execute on function public.update_proposed_image(uuid, int, jsonb) from public;
