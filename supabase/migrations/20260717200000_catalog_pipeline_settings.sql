-- Fase 4 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §10 item 3): the bulk-approve threshold
-- (confidence + status_recommendation) was hardcoded in queries.ts — make it admin-configurable.
-- Singleton table, same shape/RLS pattern as site_settings (09-DATA-SCHEMA.md §4.1): admin-only
-- write, editor+admin read.
create table catalog_pipeline_settings (
  id                                     smallint primary key default 1 check (id = 1),
  auto_publish_min_confidence            draft_confidence not null default 'tinggi',
  auto_publish_require_recommendation    boolean not null default true,
  updated_at                             timestamptz not null default now(),
  updated_by                             uuid references admin_users(user_id)
);

insert into catalog_pipeline_settings (id) values (1);

create trigger t_upd before update on catalog_pipeline_settings for each row execute function set_updated_at();

alter table catalog_pipeline_settings enable row level security;
create policy adm_read  on catalog_pipeline_settings for select using (public.is_active_admin());
create policy adm_write on catalog_pipeline_settings for all
  using (public.is_active_admin() and public.admin_role() = 'admin')
  with check (public.is_active_admin() and public.admin_role() = 'admin');
