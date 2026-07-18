-- AI Product Lifecycle — Fase 1 (docs/14-AI-PRODUCT-LIFECYCLE-PRD.md §4.2).
-- Purely additive: no ALTER/DROP on any existing table/column.

create type catalog_import_status       as enum ('parsing','staged','failed');
create type import_item_dedupe_status   as enum ('new','dup_in_sheet','dup_in_db','skip_manual');
create type import_item_status          as enum (
  'pending','queued','researching','researched','ready_for_review',
  'approved','rejected','seeded','failed'
);
create type ai_job_type                 as enum ('research_item','process_image','commit_product');
create type ai_job_status               as enum ('queued','claimed','running','succeeded','failed','partial','cancelled');
create type draft_confidence            as enum ('tinggi','sedang','rendah');
create type draft_status_recommendation as enum ('publish','draft','skip');

-- Satu row per file vendor yang diupload.
create table catalog_imports (
  id              uuid primary key default gen_random_uuid(),
  source_filename text not null,
  storage_path    text not null,              -- bucket privat catalog-raw
  row_count       int not null default 0,
  status          catalog_import_status not null default 'parsing',
  notes           text,
  uploaded_by     uuid references admin_users(user_id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Satu row per baris hasil parsing — staging table SEBELUM jadi kandidat produk.
create table catalog_import_items (
  id                  uuid primary key default gen_random_uuid(),
  import_id           uuid not null references catalog_imports(id) on delete cascade,
  row_index           int not null,
  raw_data            jsonb not null,          -- baris sheet asli, verbatim
  brand_raw           text not null,
  model_raw           text not null,
  category_guess      text,
  price_internal      numeric(15,0),
  dedupe_status       import_item_dedupe_status not null default 'new',
  matched_product_id  uuid references products(id) on delete set null,
  status              import_item_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (import_id, row_index)
);

-- Job generik (riset, proses gambar, commit) — durable, retryable (Fase 2 mengisi worker-nya;
-- Fase 1 memakai tabel ini hanya sebagai log riwayat panggilan riset sinkron).
create table ai_jobs (
  id              uuid primary key default gen_random_uuid(),
  type            ai_job_type not null,
  status          ai_job_status not null default 'queued',
  import_item_id  uuid references catalog_import_items(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  provider        text not null default 'anthropic',
  input           jsonb not null default '{}'::jsonb,
  output          jsonb,
  error           text,
  attempt         int not null default 0,
  max_attempts    int not null default 3,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references admin_users(user_id)
);

-- Log append-only per job — bahan progress bar & observability, tanpa websocket.
create table ai_job_events (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references ai_jobs(id) on delete cascade,
  step       text not null,
  message    text,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- Hasil AI SEBELUM menyentuh products/product_spec_values/product_images asli — Review Queue.
create table product_research_drafts (
  id                     uuid primary key default gen_random_uuid(),
  import_item_id         uuid not null references catalog_import_items(id) on delete cascade,
  name                   text not null,
  name_correction        text,
  category_id            uuid references product_categories(id),
  product_type_id        uuid references product_types(id),
  new_product_type_name  text,             -- diisi kalau AI mengusulkan type yang belum ada
  short_spec             text,
  description_md         text,
  suitable_for           text,
  spec_source_url        text,
  confidence             draft_confidence not null,
  confidence_notes       text,
  status_recommendation  draft_status_recommendation not null,
  skip_reason            text,
  specs                  jsonb not null default '[]'::jsonb,
  proposed_images        jsonb not null default '[]'::jsonb,
  reviewed_by            uuid references admin_users(user_id),
  reviewed_at            timestamptz,
  review_notes           text,
  committed_product_id   uuid references products(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger t_upd before update on catalog_imports          for each row execute function set_updated_at();
create trigger t_upd before update on catalog_import_items     for each row execute function set_updated_at();
create trigger t_upd before update on product_research_drafts  for each row execute function set_updated_at();

-- ── RLS — pola identik 09-DATA-SCHEMA.md §5.3 (is_active_admin/admin_role) ──────────────────
alter table catalog_imports         enable row level security;
alter table catalog_import_items    enable row level security;
alter table ai_jobs                 enable row level security;
alter table ai_job_events           enable row level security;
alter table product_research_drafts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['catalog_imports','catalog_import_items','product_research_drafts'] loop
    execute format('create policy adm_read   on %I for select using (public.is_active_admin());', t);
    execute format('create policy adm_insert on %I for insert with check (public.is_active_admin());', t);
    execute format('create policy adm_update on %I for update using (public.is_active_admin());', t);
    execute format('create policy adm_delete on %I for delete using (public.is_active_admin());', t);
  end loop;
end $$;

-- ai_jobs/ai_job_events: READ ONLY untuk editor+admin. Tidak ada insert/update/delete policy —
-- worker menulis lewat service-role (bypass RLS), persis pola admin_users/leads yang sudah ada.
create policy adm_read on ai_jobs       for select using (public.is_active_admin());
create policy adm_read on ai_job_events for select using (public.is_active_admin());

-- ── Storage: bucket privat untuk file vendor mentah + gambar belum-direview ─────────────────
insert into storage.buckets (id, name, public)
values ('catalog-raw', 'catalog-raw', false)
on conflict (id) do nothing;
