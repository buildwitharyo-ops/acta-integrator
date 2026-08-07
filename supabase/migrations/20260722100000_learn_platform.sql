-- Learn with ACTA — phase 1 (docs/learn-platform/02-DATA-SEO-AND-CMS.md §7.1).
-- Lesson bodies stay in `articles` where type='learn' (§6.1). This migration adds ONE
-- column to an existing table (articles.reviewed_at) plus three new tables.
-- Deliberately NOT created: courses, modules, lessons, quizzes, progress,
-- glossary_terms, room tables. See §6.1 for the >80-published-lesson promotion trigger.
-- Forward-only like every migration in this folder: no `if not exists` guards.
-- No constraint binds articles.type in either direction (§6.1, explicit).

-- ── 1. The only column added to an existing table ───────────────────────────
alter table articles add column reviewed_at timestamptz;

comment on column articles.reviewed_at is
  'Last technical re-read. Rendered publicly as "Ditinjau JUL 2026" INSTEAD OF '
  'published_at. This turns a 15-minute re-read into a visible freshness signal — '
  'the only editorial activity that survives a fully booked month. It is NOT '
  'updated_at (a typo fix must not restamp freshness) and NOT dateModified''s '
  'only source; see §9.5.';

create index articles_reviewed_ix on articles (reviewed_at nulls first)
  where type = 'learn' and status = 'published';

comment on index articles_reviewed_ix is
  'Drives the review queue (§9.5): nulls first = never reviewed = most overdue.';

-- ── 2. Reserved-slug guard for the flat /learn/{slug} namespace ─────────────
-- Lessons share a slug namespace with the /learn/* sub-routes. `uniqueSlug()`
-- currently has NO reserved-word list, so a lesson slugged 'alat' silently
-- shadows an entire route segment and produces an undiagnosable 404.
create or replace function public.learn_slug_is_reserved(s text)
returns boolean language sql immutable as $$
  select lower(s) = any (array[
    -- live segments
    'jalur','alat','ruang','glosarium',
    -- rejected synonyms, reserved so a future rename stays possible
    'kamus','istilah','kalkulator','kelas','kursus','modul','topik','peran',
    'penulis','tim','unduh','semua','ringkasan',
    -- infrastructure
    'cari','search','sitemap','feed','rss','api','index','page','halaman'
  ]);
$$;
comment on function public.learn_slug_is_reserved(text) is
  'IMMUTABLE so it can back a CHECK constraint. Mirrored in the Zod layer of '
  'saveArticle as RESERVED_LEARN_SLUGS (lib/learn/reserved-slugs.ts) — both '
  'layers required, and the two lists must be edited together.';

alter table articles
  add constraint articles_learn_slug_not_reserved_ck
  check (type <> 'learn' or not public.learn_slug_is_reserved(slug)) not valid;
alter table articles validate constraint articles_learn_slug_not_reserved_ck;

-- ── 3. learn_paths — JALUR. The only container. ─────────────────────────────
create table learn_paths (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  title         text not null,                    -- "Akustik & Tata Suara Ruang"
  eyebrow       text,                             -- mono label, "JALUR 01"
  promise       text not null check (char_length(promise) <= 180),
                -- outcome, not description: "Setelah jalur ini Anda bisa…"
  intro_md      text not null,                    -- the pillar prose. Hand-written.
  outcome_bullets text[] not null default '{}',   -- 3–5
  -- Frozen role axis (§6.3). Text, not an enum — enum values cannot be dropped.
  role          text not null
                check (role in ('pengambil-keputusan','teknis-internal','spesifier-pengadaan')),
  cover_media_id uuid references media(id) on delete restrict,
  solution_slug text,                             -- soft commercial bridge, no FK
  sort_order    int not null default 0,
  status        pub_status not null default 'draft' check (status in ('draft','published')),
  published_at  timestamptz,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references admin_users(user_id),
  check (status <> 'published' or published_at is not null),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create unique index learn_paths_slug_ux on learn_paths (lower(slug));
create index learn_paths_pub_ix on learn_paths (sort_order) where status = 'published';

comment on table learn_paths is
  'Curated, hand-written pillar page. NOT an auto-generated index. A path with '
  '<5 published lessons must not go live — its lessons publish as orphans at '
  'flat /learn/{slug}, which costs nothing because the URL space is flat.';
comment on column learn_paths.role is
  'Bare role id, no "role:" prefix. articles.tags[] stores the same axis prefixed '
  '(role:pengambil-keputusan). lib/learn/roles.ts owns both spellings.';
comment on column learn_paths.solution_slug is
  'Deliberately no FK: the commercial bridge to /solutions/{slug} must never be '
  'able to block deleting or renaming a solution.';

-- ── 4. learn_path_lessons — the ordered join. section_label IS the module. ──
create table learn_path_lessons (
  path_id       uuid not null references learn_paths(id) on delete cascade,
  article_id    uuid not null references articles(id)    on delete cascade,
  sort_key      numeric not null,
  -- Replaces the entire `modules` table. Adjacent rows sharing a label render
  -- as a syllabus group heading. Zero FKs, zero URL, zero review cycle.
  section_label text,
  is_primary    boolean not null default false,
  primary key (path_id, article_id),
  unique (path_id, sort_key)
);
-- Exactly one primary path per lesson: drives breadcrumb + prev/next + the
-- pillar link that CI asserts (§8.4 A1).
create unique index learn_path_lessons_primary_ux
  on learn_path_lessons (article_id) where is_primary;
create index learn_path_lessons_order_ix on learn_path_lessons (path_id, sort_key);
create index learn_path_lessons_rev_ix   on learn_path_lessons (article_id);

comment on table learn_path_lessons is
  'The ONLY place lesson ordering lives, and it is edited by a non-developer — '
  'that is why paths are a table and not a TypeScript constant (§6.2).';
comment on column learn_path_lessons.sort_key is
  'Fractional, arbitrary-precision numeric. Computed ONLY by '
  'public.reorder_path_lesson() — never in JS, whose float64 reintroduces the '
  'exhaustion bug numeric exists to avoid (§6.4). unique (path_id, sort_key) '
  'turns any residual collision into a loud error, not a scrambled syllabus.';
comment on column learn_path_lessons.section_label is
  'THE "module": a plain string. Adjacent rows sharing a label render as one '
  'syllabus group heading. It has no row, no URL and no review cycle.';

-- ── 5. learn_tools — calculators. 3 rows in year one. ───────────────────────
create table learn_tools (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,                   -- 'ukuran-layar'
  name          text not null,
  -- Resolved against a frozen client-side Record<string, Component>. Unknown
  -- keys render nothing. NOT eval'd, NOT a code path.
  component_key text not null
                check (component_key ~ '^[A-Z][A-Za-z0-9]*$'),
  intro_md      text not null,
  -- ALL FOUR ARE PUBLISH-BLOCKING. This is the entire differentiator: four
  -- page-1 Indonesian sources publish four mutually incompatible viewing-distance
  -- formulas and none shows its work.
  method_md         text not null,               -- the formula, written out
  standard_ref      text not null,               -- 'ANSI/AVIXA V202.01:2016 (DISCAS)'
  assumptions       text[] not null default '{}',-- >=2, what it does NOT model
  worked_example_md text not null,               -- one full Indonesian example
  related_slugs text[] not null default '{}',    -- article slugs, soft ref
  sort_order    int not null default 0,
  status        pub_status not null default 'draft' check (status in ('draft','published')),
  published_at  timestamptz,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references admin_users(user_id),
  check (status <> 'published' or published_at is not null),
  -- coalesce(): array_length('{}', 1) is NULL, and a NULL CHECK expression PASSES.
  -- Without it this publish-blocking rule silently admits an empty assumptions[].
  check (status <> 'published' or coalesce(array_length(assumptions, 1), 0) >= 2),
  check (not public.learn_slug_is_reserved(slug)),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create unique index learn_tools_slug_ux on learn_tools (lower(slug));
create index learn_tools_pub_ix on learn_tools (sort_order) where status = 'published';

comment on table learn_tools is
  'Calculators. method_md + standard_ref + >=2 assumptions + worked_example_md '
  'are publish-blocking (§9.3): showing the work IS the differentiator.';
comment on column learn_tools.component_key is
  'Resolved against a frozen client-side Record<string, Component>. Unknown keys '
  'render nothing. Never eval''d, never a code path — which is why the regex '
  'CHECK and the admin-only RLS policy on this table both exist.';

-- ── 6. updated_at triggers ──────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['learn_paths','learn_tools'] loop
    execute format('create trigger t_upd before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ── 7. Fractional reorder RPC (§6.4). Client never computes a sort key. ─────
create or replace function public.reorder_path_lesson(
  p_path_id    uuid,
  p_article_id uuid,
  p_after_id   uuid,   -- null => move to head
  p_before_id  uuid    -- null => move to tail
) returns numeric
language plpgsql security definer set search_path = public as $$
declare a numeric; b numeric; k numeric;
begin
  if not public.is_active_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select sort_key into a from learn_path_lessons
   where path_id = p_path_id and article_id = p_after_id;
  select sort_key into b from learn_path_lessons
   where path_id = p_path_id and article_id = p_before_id;

  if    a is null and b is null then
    select coalesce(max(sort_key), 0) + 1024 into k
      from learn_path_lessons where path_id = p_path_id;
  elsif a is null then k := b - 1024;
  elsif b is null then k := a + 1024;
  else                 k := (a + b) / 2;   -- numeric: arbitrary precision, never exhausts
  end if;

  update learn_path_lessons set sort_key = k
   where path_id = p_path_id and article_id = p_article_id;
  if not found then
    insert into learn_path_lessons (path_id, article_id, sort_key)
    values (p_path_id, p_article_id, k);
  end if;
  return k;
end $$;

comment on function public.reorder_path_lesson(uuid,uuid,uuid,uuid) is
  'SECURITY DEFINER so it can write past RLS, with an explicit is_active_admin() '
  'gate inside — same pattern as update_proposed_image() in 20260717170000. '
  'The gate is the authorisation boundary, so the signed-in `authenticated` role '
  'is granted EXECUTE and anon is not; is_active_admin() is false for anon '
  'anyway, but an explicit revoke is cheaper than reasoning about it later.';

revoke execute on function public.reorder_path_lesson(uuid,uuid,uuid,uuid) from public;
revoke execute on function public.reorder_path_lesson(uuid,uuid,uuid,uuid) from anon;
grant  execute on function public.reorder_path_lesson(uuid,uuid,uuid,uuid) to authenticated;
