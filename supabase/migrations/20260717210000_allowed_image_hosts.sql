-- Fase 4 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §7.7/§10 item 5): admin-managed hosts IN ADDITION
-- to the hardcoded list in lib/image-hosts.ts (which next.config.ts's images.remotePatterns still
-- needs statically at build time, so that list is never removed — this table is a union source,
-- checked only by server-side URL validators). Admin-only write, editor+admin read — same bucket
-- as product_categories/spec_definitions (infra-config tables, not day-to-day content).
create table allowed_image_hosts (
  id         uuid primary key default gen_random_uuid(),
  hostname   text not null unique,
  notes      text,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(user_id)
);

alter table allowed_image_hosts enable row level security;
create policy adm_read  on allowed_image_hosts for select using (public.is_active_admin());
create policy adm_write on allowed_image_hosts for all
  using (public.is_active_admin() and public.admin_role() = 'admin')
  with check (public.is_active_admin() and public.admin_role() = 'admin');
