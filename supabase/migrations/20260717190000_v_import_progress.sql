-- Fase 4 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §10 item 2): per-import status aggregate for the
-- import list's progress bar. Admin-only (queried server-side via service-role in
-- lib/catalog-pipeline/queries.ts) — no anon/authenticated grant, unlike the site's public v_*
-- views which are a different, public-facing pattern (09-DATA-SCHEMA.md §5.2).
create view v_import_progress as
select
  ci.id as import_id,
  count(cii.id) as total_items,
  count(*) filter (where cii.status = 'pending') as pending_count,
  count(*) filter (where cii.status = 'queued') as queued_count,
  count(*) filter (where cii.status = 'researching') as researching_count,
  count(*) filter (where cii.status = 'ready_for_review') as ready_for_review_count,
  count(*) filter (where cii.status = 'approved') as approved_count,
  count(*) filter (where cii.status = 'rejected') as rejected_count,
  count(*) filter (where cii.status = 'seeded') as seeded_count,
  count(*) filter (where cii.status = 'failed') as failed_count
from catalog_imports ci
left join catalog_import_items cii on cii.import_id = ci.id
group by ci.id;
