-- ACTA site schema (09-DATA-SCHEMA.md §1–§4, §6, §7). Separate project from ACTA-OS.
-- Tables are ordered FK-safe: parents before children.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- ── Enums (§2) ──────────────────────────────────────────────────────────────
create type pub_status            as enum ('draft','scheduled','published','archived');
create type solution_tier         as enum ('core','supporting');
create type article_type          as enum ('news','learn');
create type learn_level           as enum ('dasar','menengah');
create type spec_data_type        as enum ('number','text','boolean','enum');
create type better_direction      as enum ('higher','lower');
create type admin_role            as enum ('admin','editor');
create type media_kind            as enum ('upload','external');
create type lead_form_type        as enum ('quote_form','contact_form');
create type solution_section_type as enum ('pain_points','system_copy','scope_pillar','cta');

-- ── Auth & admin (§3) ───────────────────────────────────────────────────────
create table admin_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        citext not null unique,
  display_name text not null,
  role         admin_role not null default 'editor',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Media library (§4.7) ────────────────────────────────────────────────────
create table media (
  id             uuid primary key default gen_random_uuid(),
  kind           media_kind not null,
  storage_path   text,
  external_url   text,
  alt            text,
  caption        text,
  source_license text,
  is_placeholder boolean not null default true,
  width          int,
  height         int,
  created_at     timestamptz not null default now(),
  created_by     uuid references admin_users(user_id),
  check ((kind = 'upload')   = (storage_path is not null)),
  check ((kind = 'external') = (external_url is not null)),
  check (kind <> 'external' or source_license is not null)
);

-- ── Brands & catalog taxonomy (§4.3–§4.5) ───────────────────────────────────
create table brands (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null unique,
  slug                 text not null unique,
  website              text,
  logo_media_id        uuid references media(id) on delete set null,
  is_authorized_dealer boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table product_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table spec_definitions (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references product_categories(id) on delete cascade,
  key              text not null,
  label            text not null,
  spec_group       text not null,
  data_type        spec_data_type not null,
  unit             text,
  enum_options     text[],
  sort_order       int not null default 0,
  is_filterable    boolean not null default false,
  is_comparable    boolean not null default true,
  better_direction better_direction,
  is_archived      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (category_id, key),
  check (data_type <> 'enum' or enum_options is not null),
  check (better_direction is null or data_type = 'number')
);

-- ── Solutions & authors (§4.11, §4.13) ──────────────────────────────────────
create table solutions (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null,
  name                   text not null,
  tier                   solution_tier not null,
  value_prop             text not null,
  hero_headline          text,
  hero_subcopy           text,
  hero_media_id          uuid references media(id) on delete set null,
  hero_annotations       jsonb not null default '[]'::jsonb,
  signal_chain           jsonb not null default '[]'::jsonb,
  related_category_slugs text[] not null default '{}',
  tags                   text[] not null default '{}',
  wa_message             text,
  seo_title              text,
  seo_description        text,
  sort_order             int not null default 0,
  status                 pub_status not null default 'draft' check (status in ('draft','published')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid references admin_users(user_id)
);
create unique index solutions_slug_ux on solutions (lower(slug));

create table authors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  role           text,
  photo_media_id uuid references media(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table article_categories (
  id         uuid primary key default gen_random_uuid(),
  type       article_type not null,
  name       text not null,
  slug       text not null,
  sort_order int not null default 0,
  unique (type, slug)
);

-- ── Products (§4.6) ─────────────────────────────────────────────────────────
create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null,
  brand_id        uuid not null references brands(id) on delete restrict,
  category_id     uuid not null references product_categories(id) on delete restrict,
  short_spec      text not null check (char_length(short_spec) <= 80),
  description_md  text,
  suitable_for    text,
  spec_source_url text,
  internal_price  numeric(15,0),          -- INTERNAL — never exposed in any public view (§5.2)
  is_featured     boolean not null default false,
  status          pub_status not null default 'draft' check (status in ('draft','published')),
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references admin_users(user_id)
);
create unique index products_slug_ux on products (lower(slug));

-- ── Projects (§4.15) ────────────────────────────────────────────────────────
create table projects (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null,
  public_label         text not null,
  client_name_internal text,             -- INTERNAL — never public
  value_idr            numeric(15,0),     -- INTERNAL — never public
  year                 int,
  location_label       text,
  scope_description    text,
  scope_chips          text[] not null default '{}',
  cover_media_id       uuid references media(id) on delete set null,
  status               pub_status not null default 'draft' check (status in ('draft','published')),
  sort_order           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  updated_by           uuid references admin_users(user_id)
);
create unique index projects_slug_ux on projects (lower(slug));

-- ── Articles (§4.14) ────────────────────────────────────────────────────────
create table articles (
  id             uuid primary key default gen_random_uuid(),
  type           article_type not null,
  slug           text not null,
  title          text not null,
  excerpt        text not null check (char_length(excerpt) <= 160),
  cover_media_id uuid references media(id) on delete restrict,
  body           jsonb not null,
  category_id    uuid references article_categories(id) on delete restrict,
  level          learn_level,
  reading_time   int,
  author_id      uuid not null references authors(id) on delete restrict,
  tags           text[] not null default '{}',
  is_featured    boolean not null default false,
  status         pub_status not null default 'draft',
  published_at   timestamptz,
  scheduled_at   timestamptz,
  seo_title      text,
  seo_description text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references admin_users(user_id),
  check (status <> 'scheduled' or scheduled_at is not null),
  check (status <> 'published' or published_at is not null),
  check (status not in ('published','scheduled') or cover_media_id is not null),
  check (level is null or type = 'learn')
);
create unique index articles_slug_ux on articles (type, lower(slug));

-- ── Product relations (§4.8–§4.10) ──────────────────────────────────────────
create table product_images (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  media_id         uuid not null references media(id) on delete restrict,
  sort_order       int not null default 0,
  image_annotation text,
  unique (product_id, media_id)
);

create table product_spec_values (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  spec_definition_id uuid not null references spec_definitions(id) on delete restrict,
  value_text         text not null,
  value_number       numeric,
  value_boolean      boolean,
  value_options      text[],
  unique (product_id, spec_definition_id)
);

create table product_solutions (
  product_id  uuid not null references products(id)  on delete cascade,
  solution_id uuid not null references solutions(id) on delete cascade,
  sort_order  int not null default 0,
  primary key (product_id, solution_id)
);

create table product_similar (
  product_id         uuid not null references products(id) on delete cascade,
  similar_product_id uuid not null references products(id) on delete cascade,
  sort_order         int not null default 0,
  primary key (product_id, similar_product_id),
  check (product_id <> similar_product_id)
);

-- ── Solution sections (§4.12) ───────────────────────────────────────────────
create table solution_sections (
  id          uuid primary key default gen_random_uuid(),
  solution_id uuid not null references solutions(id) on delete cascade,
  type        solution_section_type not null,
  heading     text,
  body        text,
  items       jsonb not null default '[]'::jsonb,
  sort_order  int not null default 0
);

-- ── Article relations (§4.14) ───────────────────────────────────────────────
create table article_products (
  article_id uuid not null references articles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  sort_order int not null default 0,
  primary key (article_id, product_id)
);

create table article_solutions (
  article_id  uuid not null references articles(id) on delete cascade,
  solution_id uuid not null references solutions(id) on delete cascade,
  primary key (article_id, solution_id)
);

create table article_related (
  article_id         uuid not null references articles(id) on delete cascade,
  related_article_id uuid not null references articles(id) on delete cascade,
  sort_order         int not null default 0,
  primary key (article_id, related_article_id),
  check (article_id <> related_article_id)
);

-- ── Project relations (§4.15) ───────────────────────────────────────────────
create table project_images (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  media_id   uuid not null references media(id) on delete restrict,
  sort_order int not null default 0,
  unique (project_id, media_id)
);

create table project_products (
  project_id uuid not null references projects(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (project_id, product_id)
);

create table project_solutions (
  project_id  uuid not null references projects(id) on delete cascade,
  solution_id uuid not null references solutions(id) on delete cascade,
  primary key (project_id, solution_id)
);

-- ── Redirects, leads, newsletter (§4.16–§4.18) ──────────────────────────────
create table redirects (
  id               uuid primary key default gen_random_uuid(),
  source_path      text not null unique,
  destination_path text not null,
  created_at       timestamptz not null default now(),
  check (source_path <> destination_path)
);

create table leads (
  id            uuid primary key default gen_random_uuid(),
  form_type     lead_form_type not null,
  name          text not null,
  company       text,
  email         citext,
  phone         text,
  message       text,
  product_slug  text,
  solution_slug text,
  page_url      text not null,
  forwarded_ok  boolean not null default false,
  forward_error text,
  created_at    timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create table lead_throttle (
  ip_hash      text primary key,
  window_start timestamptz not null default now(),
  count        int not null default 1
);

create table newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null unique,
  source_path     text,
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ── Page sections (§4.2) ────────────────────────────────────────────────────
create table page_sections (
  id          uuid primary key default gen_random_uuid(),
  page_key    text not null,
  section_key text not null,
  content     jsonb not null default '{}'::jsonb,
  is_enabled  boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admin_users(user_id),
  unique (page_key, section_key)
);

-- ── Site settings singleton (§4.1) — created last (cross-ref FK to products) ─
create table site_settings (
  id                      smallint primary key default 1 check (id = 1),
  email                   citext not null,
  whatsapp_number         text not null,
  instagram               text,
  address                 text,
  city                    text,
  business_hours          jsonb,
  tagline                 text,
  footer_description      text,
  response_claim          text,
  claim_verified          boolean not null default false,
  seo_default_title       text,
  seo_default_description text,
  featured_product_id     uuid references products(id) on delete set null,
  updated_at              timestamptz not null default now(),
  updated_by              uuid references admin_users(user_id)
);

-- ── Triggers: set_updated_at (§7.1) ─────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger t_upd before update on admin_users        for each row execute function set_updated_at();
create trigger t_upd before update on brands             for each row execute function set_updated_at();
create trigger t_upd before update on product_categories for each row execute function set_updated_at();
create trigger t_upd before update on spec_definitions   for each row execute function set_updated_at();
create trigger t_upd before update on solutions          for each row execute function set_updated_at();
create trigger t_upd before update on products           for each row execute function set_updated_at();
create trigger t_upd before update on projects           for each row execute function set_updated_at();
create trigger t_upd before update on articles           for each row execute function set_updated_at();
create trigger t_upd before update on page_sections      for each row execute function set_updated_at();
create trigger t_upd before update on site_settings      for each row execute function set_updated_at();

-- ── Scheduled publish (§7.2) — called by Vercel Cron via /api/cron ──────────
create or replace function public.publish_due_articles()
returns table (id uuid, type article_type, slug text)
language sql security definer set search_path = public as $$
  update articles
     set status = 'published', published_at = now()
   where status = 'scheduled' and scheduled_at <= now()
  returning id, type, slug;
$$;

-- ── Indexes (§6) ────────────────────────────────────────────────────────────
create index products_category_ix on products (category_id) where status = 'published';
create index products_featured_ix on products (is_featured) where status = 'published' and is_featured;
create index products_created_ix  on products (created_at desc);
create index psv_product_ix        on product_spec_values (product_id);
create index psv_def_number_ix     on product_spec_values (spec_definition_id, value_number);
create index psv_def_options_gin   on product_spec_values using gin (value_options);
create index specdef_category_ix   on spec_definitions (category_id, sort_order) where not is_archived;
create index solutions_pub_ix      on solutions (tier, sort_order) where status = 'published';
create index solutions_tags_gin    on solutions using gin (tags);
create index solutions_relcat_gin  on solutions using gin (related_category_slugs);
create index articles_feed_ix      on articles (type, published_at desc) where status = 'published';
create index articles_featured_ix  on articles (type, published_at desc) where status = 'published' and is_featured;
create index articles_sched_ix     on articles (scheduled_at) where status = 'scheduled';
create index articles_tags_gin     on articles using gin (tags);
create index projects_pub_ix       on projects (sort_order) where status = 'published';
create index media_placeholder_ix  on media (is_placeholder) where is_placeholder;
create index leads_created_ix      on leads (created_at desc);
