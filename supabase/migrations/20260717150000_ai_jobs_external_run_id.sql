-- Fase 2 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §4.4/§10): research jobs now run on Trigger.dev
-- instead of synchronously in the server action. This column links an ai_jobs row back to its
-- Trigger.dev run id, so the Job History UI can show/link the underlying run for debugging.
-- Purely additive.
alter table ai_jobs add column external_run_id text;
