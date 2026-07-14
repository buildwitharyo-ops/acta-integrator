-- ── Product Types (Category → Product Type → Spec Fields) ──────────────────
-- Restructures spec_definitions from one flat template per category into a
-- template per product TYPE within a category (e.g. Display splits into
-- Interactive Flat Panel / Commercial Display / LED Display / Video Wall
-- Display, each with its own, disjoint spec field set — "Less is More").
-- products.category_id is UNCHANGED (still drives /products/c/{category},
-- mega menu, catalog grouping). products.product_type_id is the new,
-- narrower classification that drives which spec fields apply.

-- Drop the objects that depend on spec_definitions.category_id so the column
-- can be replaced cleanly.
drop index if exists specdef_category_ix;
drop view if exists v_spec_definitions;

create table product_types (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references product_categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category_id, slug),
  unique (category_id, name)
);

create trigger t_upd before update on product_types for each row execute function set_updated_at();

alter table product_types enable row level security;
create policy adm_read  on product_types for select using (public.is_active_admin());
create policy adm_write on product_types for all using (public.is_active_admin() and public.admin_role() = 'admin')
  with check (public.is_active_admin() and public.admin_role() = 'admin');

create view v_product_types as
  select id, category_id, name, slug, sort_order from product_types order by sort_order;
grant select on v_product_types to anon, authenticated;

-- spec_definitions: category_id → product_type_id. Nullable (not NOT NULL) so a
-- product whose real-world type has no template yet (see products below) can
-- still exist without blocking the migration; publish guardrails stay app-level.
alter table spec_definitions drop column category_id;
alter table spec_definitions add column product_type_id uuid references product_types(id) on delete restrict;
alter table spec_definitions add constraint spec_definitions_product_type_id_key unique (product_type_id, key);
create index specdef_type_ix on spec_definitions (product_type_id, sort_order) where not is_archived;

create view v_spec_definitions as
  select id, product_type_id, key, label, spec_group, data_type, unit, enum_options,
         sort_order, is_filterable, is_comparable, better_direction
  from spec_definitions where not is_archived;
grant select on v_spec_definitions to anon, authenticated;

-- products: add the new, optional, narrower classification alongside the
-- existing required category_id.
alter table products add column product_type_id uuid references product_types(id) on delete restrict;
create index products_type_ix on products (product_type_id) where status = 'published';

-- v_products: append product_type fields (LEFT JOIN — a product may have no
-- type yet). Existing column order/types unchanged, so CREATE OR REPLACE is safe.
create or replace view v_products as
  select p.id, p.name, p.slug, p.brand_id, b.name as brand_name, b.slug as brand_slug,
         p.category_id, c.slug as category_slug, p.short_spec, p.description_md,
         p.suitable_for, p.spec_source_url, p.is_featured,
         p.seo_title, p.seo_description, p.created_at, p.updated_at,
         p.product_type_id, pt.slug as product_type_slug, pt.name as product_type_name
  from products p
  join brands b on b.id = p.brand_id
  join product_categories c on c.id = p.category_id
  left join product_types pt on pt.id = p.product_type_id
  where p.status = 'published';
