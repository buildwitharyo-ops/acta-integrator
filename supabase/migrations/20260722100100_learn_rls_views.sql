-- Learn phase 1: public views + RLS (docs/learn-platform/02-DATA-SEO-AND-CMS.md §7.2).
-- Follows 20260711120100 exactly — anon has ZERO base-table policies; public read
-- is v_* views only. Forward-only: no `if not exists` guards.

-- ── Public views ────────────────────────────────────────────────────────────
create view v_learn_paths as
  select p.id, p.slug, p.title, p.eyebrow, p.promise, p.intro_md,
         p.outcome_bullets, p.role, p.solution_slug, p.sort_order,
         p.seo_title, p.seo_description, p.updated_at, p.published_at,
         m.storage_path as cover_image_path, m.external_url as cover_image_url_ext,
         m.alt as cover_image_alt, m.is_placeholder as cover_is_placeholder
  from learn_paths p
  left join media m on m.id = p.cover_media_id
  where p.status = 'published';

-- The syllabus. Joins to published articles on BOTH sides, so an unpublished
-- lesson simply vanishes from the path — absence must be unrepresentable in
-- the UI (render steps.filter(resolved); never an empty slot).
create view v_learn_path_lessons as
  select pl.path_id, pl.article_id, pl.sort_key, pl.section_label, pl.is_primary,
         a.slug, a.title, a.excerpt, a.level, a.reading_time, a.tags,
         a.published_at, a.reviewed_at,
         p.slug as path_slug, p.title as path_title
  from learn_path_lessons pl
  join learn_paths p on p.id = pl.path_id    and p.status = 'published'
  join articles    a on a.id = pl.article_id and a.status = 'published' and a.type = 'learn';

create view v_learn_tools as
  select id, slug, name, component_key, intro_md, method_md, standard_ref,
         assumptions, worked_example_md, related_slugs, sort_order,
         seo_title, seo_description, updated_at, published_at
  from learn_tools where status = 'published';

-- v_articles gains reviewed_at. Without it the lesson template cannot render
-- "Ditinjau {BULAN YYYY}" and JSON-LD dateModified has no source (§9.5) — the
-- lesson page reads v_articles, and only v_learn_path_lessons exposed the column.
-- Appended last so `create or replace view` is legal (existing column names,
-- types and order are unchanged); the anon/authenticated grant survives because
-- the view object is replaced, not dropped — same as v_products in 20260714100000.
create or replace view v_articles as
  select a.id, a.type, a.slug, a.title, a.excerpt, a.is_featured,
         m.storage_path as cover_image_path, m.external_url as cover_image_url_ext,
         m.alt as cover_image_alt, m.caption as cover_caption, m.source_license as cover_credit,
         m.is_placeholder as cover_is_placeholder,
         a.body, a.category_id, ac.name as category_name, ac.slug as category_slug,
         a.level, a.reading_time, a.tags, a.published_at, a.updated_at,
         au.name as author_name, au.role as author_role, au.photo_media_id as author_photo_media_id,
         a.seo_title, a.seo_description, a.reviewed_at
  from articles a
  join authors au on au.id = a.author_id
  left join article_categories ac on ac.id = a.category_id
  left join media m on m.id = a.cover_media_id
  where a.status = 'published';

-- ── RLS ─────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['learn_paths','learn_path_lessons','learn_tools'] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Editor+admin read/insert/update on the ordered join and paths.
do $$
declare t text;
begin
  foreach t in array array['learn_paths','learn_path_lessons'] loop
    execute format('create policy adm_read   on %I for select using (public.is_active_admin());', t);
    execute format('create policy adm_insert on %I for insert with check (public.is_active_admin());', t);
    execute format('create policy adm_update on %I for update using (public.is_active_admin());', t);
  end loop;
end $$;

-- Delete: editors may only hard-delete draft paths (status-bearing table pattern).
create policy adm_delete on learn_paths for delete
  using (public.is_active_admin()
         and (public.admin_role() = 'admin' or status = 'draft'));
create policy adm_delete on learn_path_lessons for delete
  using (public.is_active_admin());

-- learn_tools is admin-write-only: component_key binds to a real React component
-- and standard_ref is a correctness claim. An editor must not invent either.
create policy adm_read  on learn_tools for select using (public.is_active_admin());
create policy adm_write on learn_tools for all
  using       (public.is_active_admin() and public.admin_role() = 'admin')
  with check  (public.is_active_admin() and public.admin_role() = 'admin');

-- ── Public grants ───────────────────────────────────────────────────────────
do $$
declare v text;
begin
  foreach v in array array['v_learn_paths','v_learn_path_lessons','v_learn_tools'] loop
    execute format('grant select on %I to anon, authenticated;', v);
  end loop;
end $$;
